import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getAllAdjustments = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const skip = (page - 1) * limit;

        const [adjustments, total] = await Promise.all([
            prisma.stockAdjustment.findMany({
                skip,
                take: limit,
                include: {
                    location: true,
                    user: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.stockAdjustment.count()
        ]);

        res.json({
            adjustments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Adjustments GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createAdjustment = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { locationId, productId, quantityChange, reason, notes } = req.body;

        if (!locationId || !productId || quantityChange === undefined || quantityChange === 0 || !reason) {
            res.status(400).json({ error: 'Location, product, non-zero quantity change, and reason are required' });
            return;
        }

        // Check current stock
        const currentStock = await prisma.stock.findUnique({
            where: {
                productId_locationId: {
                    productId,
                    locationId
                }
            }
        });

        const oldQuantity = currentStock?.quantity || 0;
        const newQuantity = oldQuantity + quantityChange;

        if (newQuantity < 0) {
            res.status(409).json({ error: 'Adjustment would result in negative stock' });
            return;
        }

        // Generate adjustment number
        const adjustmentCount = await prisma.stockAdjustment.count();
        const adjustmentNumber = `ADJ-${(adjustmentCount + 1).toString().padStart(6, '0')}`;

        // Create adjustment and update stock
        const adjustment = await prisma.$transaction(async (tx) => {
            const createdAdjustment = await tx.stockAdjustment.create({
                data: {
                    adjustmentNumber,
                    locationId,
                    productId,
                    userId,
                    quantityChange,
                    reason,
                    notes
                },
                include: {
                    location: true,
                    user: { select: { id: true, name: true, email: true } }
                }
            });

            // Update or create stock record
            if (currentStock) {
                await tx.stock.update({
                    where: { id: currentStock.id },
                    data: { quantity: newQuantity }
                });
            } else {
                await tx.stock.create({
                    data: {
                        productId,
                        locationId,
                        quantity: newQuantity
                    }
                });
            }

            // Create move history record
            const moveType = quantityChange > 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';

            await tx.moveHistory.create({
                data: {
                    moveType,
                    productId,
                    locationId,
                    userId,
                    quantityBefore: oldQuantity,
                    quantityAfter: newQuantity,
                    quantityChanged: quantityChange,
                    referenceId: createdAdjustment.id,
                    notes: `Stock adjustment: ${reason}`
                }
            });

            return createdAdjustment;
        });

        res.status(201).json(adjustment);
    } catch (error) {
        console.error('Adjustments POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
