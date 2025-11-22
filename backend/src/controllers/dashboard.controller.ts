import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        // Get query parameters for filtering
        const locationId = req.query.locationId as string;
        const days = parseInt(req.query.days as string || '30');

        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);

        // Build base where clause for location filtering
        const locationFilter = locationId ? { locationId } : {};

        // Get total products count
        const totalProducts = await prisma.product.count();

        // Get total locations count
        const totalLocations = await prisma.location.count();

        // Get total stock value (sum of all quantities)
        const stockSummary = await prisma.stock.aggregate({
            where: locationFilter,
            _sum: {
                quantity: true
            },
            _count: {
                id: true
            }
        });

        // Get low stock products (where current stock <= minStock)
        const lowStockProducts = await prisma.product.findMany({
            include: {
                stocks: {
                    where: locationFilter,
                    include: {
                        location: true
                    }
                }
            }
        });

        const filteredLowStockProducts = lowStockProducts
            .map((product: any) => {
                const totalStock = product.stocks.reduce((sum: number, stock: any) => sum + stock.quantity, 0);
                const isLowStock = totalStock <= product.minStock && product.minStock > 0;
                return { ...product, totalStock, isLowStock };
            })
            .filter((product: any) => product.isLowStock);

        // Get recent move history
        const recentMoves = await prisma.moveHistory.findMany({
            where: {
                ...locationFilter,
                createdAt: {
                    gte: dateFilter
                }
            },
            take: 10,
            include: {
                product: { select: { name: true, sku: true } },
                location: { select: { name: true } },
                user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get move history statistics for the period
        const moveStats = await prisma.moveHistory.groupBy({
            by: ['moveType'],
            where: {
                ...locationFilter,
                createdAt: {
                    gte: dateFilter
                }
            },
            _count: {
                moveType: true
            },
            _sum: {
                quantityChanged: true
            }
        });

        // Get pending receipts
        const pendingReceipts = await prisma.receiptOrder.count({
            where: {
                ...locationFilter,
                isValidated: false
            }
        });

        // Get pending deliveries
        const pendingDeliveries = await prisma.deliveryOrder.count({
            where: {
                ...locationFilter,
                isValidated: false
            }
        });

        // Get pending transfers
        const pendingTransfers = await prisma.internalTransfer.count({
            where: {
                OR: [
                    { fromLocationId: locationId },
                    { toLocationId: locationId }
                ].filter(Boolean) as any, // Type assertion for filter(Boolean)
                isApplied: false
            }
        });

        // Calculate top moving products (most activity in move history)
        const topMovingProducts = await prisma.moveHistory.groupBy({
            by: ['productId'],
            where: {
                ...locationFilter,
                createdAt: {
                    gte: dateFilter
                }
            },
            _count: {
                productId: true
            },
            _sum: {
                quantityChanged: true
            },
            orderBy: {
                _count: {
                    productId: 'desc'
                }
            },
            take: 5
        });

        // Get product details for top moving products
        const topMovingProductDetails = await Promise.all(
            topMovingProducts.map(async (item: any) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, name: true, sku: true }
                });
                return {
                    product,
                    moveCount: item._count.productId,
                    totalQuantityMoved: Math.abs(item._sum.quantityChanged || 0)
                };
            })
        );

        // Calculate stock levels by location (if no specific location filter)
        let stockByLocation: any[] = [];
        if (!locationId) {
            const stockByLocationRaw = await prisma.stock.groupBy({
                by: ['locationId'],
                _sum: {
                    quantity: true
                },
                _count: {
                    id: true
                }
            });

            stockByLocation = await Promise.all(
                stockByLocationRaw.map(async (item: any) => {
                    const location = await prisma.location.findUnique({
                        where: { id: item.locationId },
                        select: { id: true, name: true }
                    });
                    return {
                        location,
                        totalStock: item._sum.quantity || 0,
                        uniqueProducts: item._count.id
                    };
                })
            );
        }

        // Format move stats for easy consumption
        const formattedMoveStats = moveStats.reduce((acc: any, stat: any) => {
            acc[stat.moveType] = {
                count: stat._count.moveType,
                totalQuantity: Math.abs(stat._sum.quantityChanged || 0)
            };
            return acc;
        }, {});

        const dashboardData = {
            summary: {
                totalProducts,
                totalLocations,
                totalStockQuantity: stockSummary._sum.quantity || 0,
                uniqueStockItems: stockSummary._count,
                lowStockProductsCount: filteredLowStockProducts.length,
                pendingReceipts,
                pendingDeliveries,
                pendingTransfers
            },
            lowStockProducts: filteredLowStockProducts.slice(0, 10), // Top 10 low stock items
            recentMoves,
            moveStats: formattedMoveStats,
            topMovingProducts: topMovingProductDetails,
            stockByLocation,
            filters: {
                locationId,
                days,
                dateFrom: dateFilter.toISOString()
            }
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
