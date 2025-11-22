import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductPrices() {
    try {
        console.log('Updating product prices...');

        const products = await prisma.product.findMany();

        const priceMap: Record<string, number> = {
            'Laptop': 899.99,
            'Wireless Mouse': 29.99,
            'USB Cable': 9.99,
            'Printer Paper (500 sheets)': 24.99,
            'USB Flash Drive 32GB': 19.99,
        };

        for (const product of products) {
            const price = priceMap[product.name] || 49.99; // Default price

            await prisma.product.update({
                where: { id: product.id },
                data: { price }
            });

            console.log(`✓ Updated ${product.name} - Price: $${price}`);
        }

        console.log('\n✅ All product prices updated successfully!');
    } catch (error) {
        console.error('Error updating prices:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateProductPrices();
