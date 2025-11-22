import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSampleAlerts() {
    try {
        console.log('Generating sample low stock alerts...');

        // Get all products with their stock levels
        const products = await prisma.product.findMany({
            include: {
                stocks: {
                    include: {
                        location: true
                    }
                }
            }
        });

        let alertsGenerated = 0;

        for (const product of products) {
            for (const stock of product.stocks) {
                // Only check if stock is below minimum
                if (stock.quantity <= product.minStock) {
                    // Calculate severity
                    let severity: 'CRITICAL' | 'WARNING' | 'LOW';
                    const percentageOfMin = product.minStock > 0 ? (stock.quantity / product.minStock) * 100 : 0;
                    
                    if (stock.quantity === 0 || percentageOfMin <= 20) {
                        severity = 'CRITICAL';
                    } else if (percentageOfMin <= 50) {
                        severity = 'WARNING';
                    } else {
                        severity = 'LOW';
                    }

                    // Create alert
                    await prisma.lowStockAlert.upsert({
                        where: {
                            productId_locationId: {
                                productId: product.id,
                                locationId: stock.locationId
                            }
                        },
                        update: {
                            currentQty: stock.quantity,
                            minQty: product.minStock,
                            severity,
                            isRead: false,
                            updatedAt: new Date()
                        },
                        create: {
                            productId: product.id,
                            locationId: stock.locationId,
                            currentQty: stock.quantity,
                            minQty: product.minStock,
                            severity
                        }
                    });

                    console.log(`✓ Generated ${severity} alert for ${product.name} at ${stock.location.name}`);
                    alertsGenerated++;
                }
            }
        }

        console.log(`\n✅ Generated ${alertsGenerated} low stock alerts!`);
        
        // Show alert summary
        const [total, critical, warning, low] = await Promise.all([
            prisma.lowStockAlert.count(),
            prisma.lowStockAlert.count({ where: { severity: 'CRITICAL' } }),
            prisma.lowStockAlert.count({ where: { severity: 'WARNING' } }),
            prisma.lowStockAlert.count({ where: { severity: 'LOW' } })
        ]);

        console.log('\n📊 Alert Summary:');
        console.log(`   Total: ${total}`);
        console.log(`   Critical: ${critical}`);
        console.log(`   Warning: ${warning}`);
        console.log(`   Low: ${low}`);

    } catch (error) {
        console.error('Error generating alerts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateSampleAlerts();
