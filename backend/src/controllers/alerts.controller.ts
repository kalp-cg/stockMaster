import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllAlerts = async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '20', severity, isRead } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (severity) where.severity = severity;
        if (isRead !== undefined) where.isRead = isRead === 'true';

        const [alerts, total] = await Promise.all([
            prisma.lowStockAlert.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: [
                    { isRead: 'asc' },
                    { severity: 'desc' },
                    { createdAt: 'desc' }
                ]
            }),
            prisma.lowStockAlert.count({ where })
        ]);

        // Fetch related data
        const enrichedAlerts = await Promise.all(
            alerts.map(async (alert) => {
                const [product, location, stock] = await Promise.all([
                    prisma.product.findUnique({ where: { id: alert.productId } }),
                    prisma.location.findUnique({ where: { id: alert.locationId } }),
                    prisma.stock.findUnique({
                        where: {
                            productId_locationId: {
                                productId: alert.productId,
                                locationId: alert.locationId
                            }
                        }
                    })
                ]);

                return {
                    ...alert,
                    product: product ? { id: product.id, name: product.name, sku: product.sku, unit: product.unit } : null,
                    location: location ? { id: location.id, name: location.name } : null,
                    currentStock: stock?.quantity || 0
                };
            })
        );

        res.json({
            alerts: enrichedAlerts,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const markAlertAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const alert = await prisma.lowStockAlert.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        res.json(alert);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const markAllAlertsAsRead = async (req: Request, res: Response) => {
    try {
        const result = await prisma.lowStockAlert.updateMany({
            where: { isRead: false },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });

        res.json({ message: 'All alerts marked as read', count: result.count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.lowStockAlert.delete({
            where: { id }
        });

        res.json({ message: 'Alert deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const checkAndGenerateAlerts = async (req: Request, res: Response) => {
    try {
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

                    // Create or update alert
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

                    alertsGenerated++;
                } else {
                    // Delete alert if stock is now above minimum
                    await prisma.lowStockAlert.deleteMany({
                        where: {
                            productId: product.id,
                            locationId: stock.locationId
                        }
                    });
                }
            }
        }

        res.json({ 
            message: 'Alerts checked and generated', 
            alertsGenerated 
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAlertStats = async (req: Request, res: Response) => {
    try {
        const [total, unread, critical, warning, low] = await Promise.all([
            prisma.lowStockAlert.count(),
            prisma.lowStockAlert.count({ where: { isRead: false } }),
            prisma.lowStockAlert.count({ where: { severity: 'CRITICAL' } }),
            prisma.lowStockAlert.count({ where: { severity: 'WARNING' } }),
            prisma.lowStockAlert.count({ where: { severity: 'LOW' } })
        ]);

        res.json({
            total,
            unread,
            bySeverity: {
                critical,
                warning,
                low
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
