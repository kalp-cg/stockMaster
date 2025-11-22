import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getAllTransfers = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const status = req.query.status as string; // 'applied' or 'pending'
        const skip = (page - 1) * limit;

        const whereClause = status
            ? { isApplied: status === 'applied' }
            : {};

        const [transfers, total] = await Promise.all([
            prisma.internalTransfer.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    fromLocation: true,
                    toLocation: true,
                    user: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.internalTransfer.count({ where: whereClause })
        ]);

        res.json({
            transfers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Transfers GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createTransfer = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fromLocationId, toLocationId, productId, quantity, notes } = req.body;

        if (!fromLocationId || !toLocationId || !productId || !quantity || quantity <= 0) {
            res.status(400).json({ error: 'From location, to location, product, and positive quantity are required' });
            return;
        }

        if (fromLocationId === toLocationId) {
            res.status(400).json({ error: 'From and to locations must be different' });
            return;
        }

        // Check if enough stock is available at source location
        const sourceStock = await prisma.stock.findUnique({
            where: {
                productId_locationId: {
                    productId,
                    locationId: fromLocationId
                }
            }
        });

        if (!sourceStock || sourceStock.quantity < quantity) {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { name: true }
            });
            res.status(409).json({ error: `Insufficient stock for ${product?.name}. Available: ${sourceStock?.quantity || 0}, Required: ${quantity}` });
            return;
        }

        // Generate transfer number
        const transferCount = await prisma.internalTransfer.count();
        const transferNumber = `TRN-${(transferCount + 1).toString().padStart(6, '0')}`;

        const transfer = await prisma.internalTransfer.create({
            data: {
                transferNumber,
                fromLocationId,
                toLocationId,
                productId,
                userId,
                quantity,
                notes
            },
            include: {
                fromLocation: true,
                toLocation: true,
                user: { select: { id: true, name: true, email: true } }
            }
        });

        res.status(201).json(transfer);
    } catch (error) {
        console.error('Transfers POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTransfer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transfer = await prisma.internalTransfer.findUnique({
            where: { id },
            include: {
                fromLocation: true,
                toLocation: true,
                user: { select: { id: true, name: true, email: true } }
            }
        });

        if (!transfer) {
            res.status(404).json({ error: 'Transfer not found' });
            return;
        }

        res.json(transfer);
    } catch (error) {
        console.error('Transfer GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const applyTransfer = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { action } = req.body;

        if (action !== 'apply') {
            res.status(400).json({ error: 'Invalid action. Only "apply" is supported' });
            return;
        }

        // Get transfer details
        const transfer = await prisma.internalTransfer.findUnique({
            where: { id }
        });

        if (!transfer) {
            res.status(404).json({ error: 'Transfer not found' });
            return;
        }

        if (transfer.isApplied) {
            res.status(409).json({ error: 'Transfer is already applied' });
            return;
        }

        // Check stock availability again
        const sourceStock = await prisma.stock.findUnique({
            where: {
                productId_locationId: {
                    productId: transfer.productId,
                    locationId: transfer.fromLocationId
                }
            }
        });

        if (!sourceStock || sourceStock.quantity < transfer.quantity) {
            const product = await prisma.product.findUnique({
                where: { id: transfer.productId },
                select: { name: true }
            });
            res.status(409).json({ error: `Insufficient stock for ${product?.name}. Available: ${sourceStock?.quantity || 0}, Required: ${transfer.quantity}` });
            return;
        }

        // Apply transfer and update stock
        const updatedTransfer = await prisma.$transaction(async (tx) => {
            // Update transfer status
            const appliedTransfer = await tx.internalTransfer.update({
                where: { id },
                data: {
                    isApplied: true,
                    appliedAt: new Date()
                }
            });

            // Decrease stock at source location
            const oldSourceQuantity = sourceStock.quantity;
            const newSourceQuantity = oldSourceQuantity - transfer.quantity;

            await tx.stock.update({
                where: { id: sourceStock.id },
                data: { quantity: newSourceQuantity }
            });

            // Create move history for source (outgoing)
            await tx.moveHistory.create({
                data: {
                    moveType: 'TRANSFER_OUT',
                    productId: transfer.productId,
                    locationId: transfer.fromLocationId,
                    userId,
                    quantityBefore: oldSourceQuantity,
                    quantityAfter: newSourceQuantity,
                    quantityChanged: -transfer.quantity,
                    referenceId: transfer.id,
                    notes: `Transfer out: ${transfer.transferNumber} to ${transfer.toLocationId}`
                }
            });

            // Find or create stock at destination location
            let destinationStock = await tx.stock.findUnique({
                where: {
                    productId_locationId: {
                        productId: transfer.productId,
                        locationId: transfer.toLocationId
                    }
                }
            });

            const oldDestQuantity = destinationStock?.quantity || 0;
            const newDestQuantity = oldDestQuantity + transfer.quantity;

            if (destinationStock) {
                await tx.stock.update({
                    where: { id: destinationStock.id },
                    data: { quantity: newDestQuantity }
                });
            } else {
                await tx.stock.create({
                    data: {
                        productId: transfer.productId,
                        locationId: transfer.toLocationId,
                        quantity: newDestQuantity
                    }
                });
            }

            // Create move history for destination (incoming)
            await tx.moveHistory.create({
                data: {
                    moveType: 'TRANSFER_IN',
                    productId: transfer.productId,
                    locationId: transfer.toLocationId,
                    userId,
                    quantityBefore: oldDestQuantity,
                    quantityAfter: newDestQuantity,
                    quantityChanged: transfer.quantity,
                    referenceId: transfer.id,
                    notes: `Transfer in: ${transfer.transferNumber} from ${transfer.fromLocationId}`
                }
            });

            return appliedTransfer;
        });

        res.json({
            message: 'Transfer applied successfully',
            transfer: updatedTransfer
        });
    } catch (error) {
        console.error('Transfer apply error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
