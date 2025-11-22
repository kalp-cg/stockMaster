import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getAllDeliveries = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const status = req.query.status as string; // 'validated' or 'pending'
        const skip = (page - 1) * limit;

        const whereClause = status
            ? { isValidated: status === 'validated' }
            : {};

        const [deliveries, total] = await Promise.all([
            prisma.deliveryOrder.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    location: true,
                    user: { select: { id: true, name: true, email: true } },
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.deliveryOrder.count({ where: whereClause })
        ]);

        res.json({
            deliveries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Deliveries GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createDelivery = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { locationId, items, notes } = req.body;

        if (!locationId || !items || items.length === 0) {
            res.status(400).json({ error: 'Location and items are required' });
            return;
        }

        // Validate items and check stock availability
        for (const item of items) {
            if (!item.productId || !item.quantityDelivered || item.quantityDelivered <= 0) {
                res.status(400).json({ error: 'All items must have productId and positive quantityDelivered' });
                return;
            }

            // Check if enough stock is available
            const stock = await prisma.stock.findUnique({
                where: {
                    productId_locationId: {
                        productId: item.productId,
                        locationId
                    }
                }
            });

            if (!stock || stock.quantity < item.quantityDelivered) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true }
                });
                res.status(409).json({ error: `Insufficient stock for ${product?.name}. Available: ${stock?.quantity || 0}, Required: ${item.quantityDelivered}` });
                return;
            }
        }

        // Generate delivery number
        const deliveryCount = await prisma.deliveryOrder.count();
        const deliveryNumber = `DEL-${(deliveryCount + 1).toString().padStart(6, '0')}`;

        // Create delivery with items
        const delivery = await prisma.deliveryOrder.create({
            data: {
                deliveryNumber,
                locationId,
                userId,
                totalItems: items.reduce((sum: number, item: any) => sum + item.quantityDelivered, 0),
                notes,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantityDelivered: item.quantityDelivered
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                location: true
            }
        });

        res.status(201).json(delivery);
    } catch (error) {
        console.error('Deliveries POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDelivery = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const delivery = await prisma.deliveryOrder.findUnique({
            where: { id },
            include: {
                location: true,
                user: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!delivery) {
            res.status(404).json({ error: 'Delivery not found' });
            return;
        }

        res.json(delivery);
    } catch (error) {
        console.error('Delivery GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const validateDelivery = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { action } = req.body;

        if (action !== 'validate') {
            res.status(400).json({ error: 'Invalid action. Only "validate" is supported' });
            return;
        }

        // Get delivery with items
        const delivery = await prisma.deliveryOrder.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!delivery) {
            res.status(404).json({ error: 'Delivery not found' });
            return;
        }

        if (delivery.isValidated) {
            res.status(409).json({ error: 'Delivery is already validated' });
            return;
        }

        // Check stock availability again
        for (const item of delivery.items) {
            const stock = await prisma.stock.findUnique({
                where: {
                    productId_locationId: {
                        productId: item.productId,
                        locationId: delivery.locationId
                    }
                }
            });

            if (!stock || stock.quantity < item.quantityDelivered) {
                res.status(409).json({ error: `Insufficient stock for ${item.product.name}. Available: ${stock?.quantity || 0}, Required: ${item.quantityDelivered}` });
                return;
            }
        }

        // Validate delivery and update stock
        const updatedDelivery = await prisma.$transaction(async (tx) => {
            // Update delivery status
            const validatedDelivery = await tx.deliveryOrder.update({
                where: { id },
                data: {
                    isValidated: true,
                    validatedAt: new Date()
                }
            });

            // Process each item
            for (const item of delivery.items) {
                const stock = await tx.stock.findUnique({
                    where: {
                        productId_locationId: {
                            productId: item.productId,
                            locationId: delivery.locationId
                        }
                    }
                });

                const oldQuantity = stock!.quantity;
                const newQuantity = oldQuantity - item.quantityDelivered;

                await tx.stock.update({
                    where: { id: stock!.id },
                    data: { quantity: newQuantity }
                });

                // Create move history record
                await tx.moveHistory.create({
                    data: {
                        moveType: 'DELIVERY',
                        productId: item.productId,
                        locationId: delivery.locationId,
                        userId,
                        quantityBefore: oldQuantity,
                        quantityAfter: newQuantity,
                        quantityChanged: -item.quantityDelivered,
                        referenceId: delivery.id,
                        notes: `Delivery validation: ${delivery.deliveryNumber}`
                    }
                });
            }

            return validatedDelivery;
        });

        res.json({
            message: 'Delivery validated successfully',
            delivery: updatedDelivery
        });
    } catch (error) {
        console.error('Delivery validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
