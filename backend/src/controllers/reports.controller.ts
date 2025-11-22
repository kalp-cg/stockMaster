import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getStockReport = async (req: Request, res: Response) => {
    try {
        const { locationId, productId } = req.query;

        const where: any = {};
        if (locationId) where.locationId = locationId as string;
        if (productId) where.productId = productId as string;

        const stocks = await prisma.stock.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        unit: true,
                        minStock: true,
                        price: true
                    }
                },
                location: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Calculate stock metrics
        const totalProducts = stocks.length;
        const lowStockCount = stocks.filter(s => s.quantity <= s.product.minStock).length;
        const outOfStockCount = stocks.filter(s => s.quantity === 0).length;
        const totalValue = stocks.reduce((sum, s) => sum + (s.quantity * s.product.price), 0);
        const averageStockLevel = stocks.length > 0 
            ? stocks.reduce((sum, s) => sum + s.quantity, 0) / stocks.length 
            : 0;

        res.json({
            stocks,
            summary: {
                totalProducts,
                lowStockCount,
                outOfStockCount,
                totalValue,
                averageStockLevel: parseFloat(averageStockLevel.toFixed(2))
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSalesReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, locationId } = req.query;

        const where: any = { isValidated: true };
        if (startDate || endDate) {
            where.validatedAt = {};
            if (startDate) where.validatedAt.gte = new Date(startDate as string);
            if (endDate) where.validatedAt.lte = new Date(endDate as string);
        }
        if (locationId) where.locationId = locationId as string;

        const deliveries = await prisma.deliveryOrder.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                                price: true
                            }
                        }
                    }
                },
                location: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Calculate sales metrics
        let totalRevenue = 0;
        let totalItems = 0;
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
        const locationSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

        deliveries.forEach(delivery => {
            delivery.items.forEach(item => {
                const revenue = item.quantityDelivered * item.product.price;
                totalRevenue += revenue;
                totalItems += item.quantityDelivered;

                // Product sales
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        name: item.product.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.productId].quantity += item.quantityDelivered;
                productSales[item.productId].revenue += revenue;

                // Location sales
                if (!locationSales[delivery.locationId]) {
                    locationSales[delivery.locationId] = {
                        name: delivery.location.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                locationSales[delivery.locationId].quantity += item.quantityDelivered;
                locationSales[delivery.locationId].revenue += revenue;
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([id, data]) => ({ productId: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const topLocations = Object.entries(locationSales)
            .map(([id, data]) => ({ locationId: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue);

        res.json({
            deliveries,
            summary: {
                totalOrders: deliveries.length,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalItems,
                averageOrderValue: deliveries.length > 0 
                    ? parseFloat((totalRevenue / deliveries.length).toFixed(2)) 
                    : 0
            },
            topProducts,
            topLocations
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPurchaseReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, vendorId } = req.query;

        const where: any = { isValidated: true };
        if (startDate || endDate) {
            where.validatedAt = {};
            if (startDate) where.validatedAt.gte = new Date(startDate as string);
            if (endDate) where.validatedAt.lte = new Date(endDate as string);
        }
        if (vendorId) where.vendorId = vendorId as string;

        const receipts = await prisma.receiptOrder.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true,
                                price: true
                            }
                        }
                    }
                },
                vendor: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                location: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Calculate purchase metrics
        let totalCost = 0;
        let totalItems = 0;
        const vendorPurchases: Record<string, { name: string; quantity: number; cost: number }> = {};
        const productPurchases: Record<string, { name: string; quantity: number; cost: number }> = {};

        receipts.forEach(receipt => {
            receipt.items.forEach(item => {
                const cost = item.quantityReceived * item.product.price;
                totalCost += cost;
                totalItems += item.quantityReceived;

                // Vendor purchases
                if (!vendorPurchases[receipt.vendorId]) {
                    vendorPurchases[receipt.vendorId] = {
                        name: receipt.vendor.name,
                        quantity: 0,
                        cost: 0
                    };
                }
                vendorPurchases[receipt.vendorId].quantity += item.quantityReceived;
                vendorPurchases[receipt.vendorId].cost += cost;

                // Product purchases
                if (!productPurchases[item.productId]) {
                    productPurchases[item.productId] = {
                        name: item.product.name,
                        quantity: 0,
                        cost: 0
                    };
                }
                productPurchases[item.productId].quantity += item.quantityReceived;
                productPurchases[item.productId].cost += cost;
            });
        });

        const topVendors = Object.entries(vendorPurchases)
            .map(([id, data]) => ({ vendorId: id, ...data }))
            .sort((a, b) => b.cost - a.cost);

        const topProducts = Object.entries(productPurchases)
            .map(([id, data]) => ({ productId: id, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        res.json({
            receipts,
            summary: {
                totalOrders: receipts.length,
                totalCost: parseFloat(totalCost.toFixed(2)),
                totalItems,
                averageOrderValue: receipts.length > 0 
                    ? parseFloat((totalCost / receipts.length).toFixed(2)) 
                    : 0
            },
            topVendors,
            topProducts
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getInventoryMovementReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, productId, locationId, moveType } = req.query;

        const where: any = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }
        if (productId) where.productId = productId as string;
        if (locationId) where.locationId = locationId as string;
        if (moveType) where.moveType = moveType as string;

        const movements = await prisma.moveHistory.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        unit: true
                    }
                },
                location: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate movement metrics
        const totalMovements = movements.length;
        const totalIn = movements
            .filter(m => m.quantityChanged > 0)
            .reduce((sum, m) => sum + m.quantityChanged, 0);
        const totalOut = movements
            .filter(m => m.quantityChanged < 0)
            .reduce((sum, m) => sum + Math.abs(m.quantityChanged), 0);

        const movementsByType = movements.reduce((acc, m) => {
            acc[m.moveType] = (acc[m.moveType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const movementsByProduct = movements.reduce((acc, m) => {
            if (!acc[m.productId]) {
                acc[m.productId] = {
                    name: m.product.name,
                    in: 0,
                    out: 0
                };
            }
            if (m.quantityChanged > 0) {
                acc[m.productId].in += m.quantityChanged;
            } else {
                acc[m.productId].out += Math.abs(m.quantityChanged);
            }
            return acc;
        }, {} as Record<string, { name: string; in: number; out: number }>);

        res.json({
            movements,
            summary: {
                totalMovements,
                totalIn,
                totalOut,
                netChange: totalIn - totalOut
            },
            movementsByType,
            movementsByProduct
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getProfitLossReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = { isValidated: true };
        if (startDate || endDate) {
            dateFilter.validatedAt = {};
            if (startDate) dateFilter.validatedAt.gte = new Date(startDate as string);
            if (endDate) dateFilter.validatedAt.lte = new Date(endDate as string);
        }

        // Calculate sales revenue
        const deliveries = await prisma.deliveryOrder.findMany({
            where: dateFilter,
            include: {
                items: {
                    include: {
                        product: {
                            select: { price: true }
                        }
                    }
                }
            }
        });

        const totalRevenue = deliveries.reduce((sum, delivery) => {
            return sum + delivery.items.reduce((itemSum, item) => {
                return itemSum + (item.quantityDelivered * item.product.price);
            }, 0);
        }, 0);

        // Calculate purchase costs
        const receipts = await prisma.receiptOrder.findMany({
            where: dateFilter,
            include: {
                items: {
                    include: {
                        product: {
                            select: { price: true }
                        }
                    }
                }
            }
        });

        const totalCost = receipts.reduce((sum, receipt) => {
            return sum + receipt.items.reduce((itemSum, item) => {
                return itemSum + (item.quantityReceived * item.product.price);
            }, 0);
        }, 0);

        // Calculate stock value
        const stocks = await prisma.stock.findMany({
            include: {
                product: {
                    select: { price: true }
                }
            }
        });

        const totalStockValue = stocks.reduce((sum, stock) => {
            return sum + (stock.quantity * stock.product.price);
        }, 0);

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        res.json({
            revenue: {
                sales: parseFloat(totalRevenue.toFixed(2)),
                totalOrders: deliveries.length
            },
            costs: {
                purchases: parseFloat(totalCost.toFixed(2)),
                totalOrders: receipts.length
            },
            profit: {
                gross: parseFloat(grossProfit.toFixed(2)),
                margin: parseFloat(profitMargin.toFixed(2))
            },
            inventory: {
                totalValue: parseFloat(totalStockValue.toFixed(2)),
                totalProducts: stocks.length
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getActivityReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
            if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
        }

        const [receipts, deliveries, transfers, adjustments] = await Promise.all([
            prisma.receiptOrder.count({ where: dateFilter }),
            prisma.deliveryOrder.count({ where: dateFilter }),
            prisma.internalTransfer.count({ where: dateFilter }),
            prisma.stockAdjustment.count({ where: dateFilter })
        ]);

        // Get user activity
        const userActivity = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                _count: {
                    select: {
                        receipts: true,
                        deliveries: true,
                        transfers: true,
                        adjustments: true
                    }
                }
            }
        });

        const sortedUsers = userActivity
            .map(user => ({
                ...user,
                totalActivity: user._count.receipts + user._count.deliveries + 
                              user._count.transfers + user._count.adjustments
            }))
            .sort((a, b) => b.totalActivity - a.totalActivity);

        res.json({
            summary: {
                totalReceipts: receipts,
                totalDeliveries: deliveries,
                totalTransfers: transfers,
                totalAdjustments: adjustments,
                totalActivity: receipts + deliveries + transfers + adjustments
            },
            userActivity: sortedUsers
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
