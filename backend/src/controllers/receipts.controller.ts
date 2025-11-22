import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getAllReceipts = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const status = req.query.status as string; // 'validated' or 'pending'
        const skip = (page - 1) * limit;

        const whereClause = status
            ? { isValidated: status === 'validated' }
            : {};

        const [receipts, total] = await Promise.all([
            prisma.receiptOrder.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    vendor: true,
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
            prisma.receiptOrder.count({ where: whereClause })
        ]);

        // Transform receipts to include status field
        const transformedReceipts = receipts.map(receipt => ({
            ...receipt,
            status: receipt.isValidated ? 'DONE' : 'WAITING',
            createdBy: receipt.user
        }));

        res.json({
            receipts: transformedReceipts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Receipts GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createReceipt = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { vendorId, locationId, items, notes } = req.body;

        if (!vendorId || !locationId || !items || items.length === 0) {
            res.status(400).json({ error: 'Vendor, location, and items are required' });
            return;
        }

        // Validate items
        for (const item of items) {
            if (!item.productId || !item.quantityReceived || item.quantityReceived <= 0) {
                res.status(400).json({ error: 'All items must have productId and positive quantityReceived' });
                return;
            }
        }

        // Generate receipt number
        const receiptCount = await prisma.receiptOrder.count();
        const receiptNumber = `RCP-${(receiptCount + 1).toString().padStart(6, '0')}`;

        // Create receipt with items in transaction
        const receipt = await prisma.$transaction(async (tx) => {
            const createdReceipt = await tx.receiptOrder.create({
                data: {
                    receiptNumber,
                    vendorId,
                    locationId,
                    userId,
                    totalItems: items.reduce((sum: number, item: any) => sum + item.quantityReceived, 0),
                    notes,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantityReceived: item.quantityReceived
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    vendor: true,
                    location: true,
                    user: { select: { id: true, name: true, email: true } }
                }
            });

            return createdReceipt;
        });

        // Transform receipt to include status field
        const transformedReceipt = {
            ...receipt,
            status: receipt.isValidated ? 'DONE' : 'WAITING',
            createdBy: receipt.user
        };

        res.status(201).json(transformedReceipt);
    } catch (error) {
        console.error('Receipts POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getReceipt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const receipt = await prisma.receiptOrder.findUnique({
            where: { id },
            include: {
                vendor: true,
                location: true,
                user: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!receipt) {
            res.status(404).json({ error: 'Receipt not found' });
            return;
        }

        // Transform receipt to include status field
        const transformedReceipt = {
            ...receipt,
            status: receipt.isValidated ? 'DONE' : 'WAITING',
            createdBy: receipt.user
        };

        res.json(transformedReceipt);
    } catch (error) {
        console.error('Receipt GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const validateReceipt = async (req: Request, res: Response) => {
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

        // Get receipt with items
        const receipt = await prisma.receiptOrder.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: { select: { id: true, name: true, email: true } }
            }
        });

        if (!receipt) {
            res.status(404).json({ error: 'Receipt not found' });
            return;
        }

        if (receipt.isValidated) {
            res.status(409).json({ error: 'Receipt is already validated' });
            return;
        }

        // Validate receipt and update stock
        const updatedReceipt = await prisma.$transaction(async (tx) => {
            // Update receipt status
            const validatedReceipt = await tx.receiptOrder.update({
                where: { id },
                data: {
                    isValidated: true,
                    validatedAt: new Date()
                }
            });

            // Process each item
            for (const item of receipt.items) {
                // Find or create stock record
                let stock = await tx.stock.findUnique({
                    where: {
                        productId_locationId: {
                            productId: item.productId,
                            locationId: receipt.locationId
                        }
                    }
                });

                const oldQuantity = stock?.quantity || 0;
                const newQuantity = oldQuantity + item.quantityReceived;

                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: { quantity: newQuantity }
                    });
                } else {
                    await tx.stock.create({
                        data: {
                            productId: item.productId,
                            locationId: receipt.locationId,
                            quantity: newQuantity
                        }
                    });
                }

                // Create move history record
                await tx.moveHistory.create({
                    data: {
                        moveType: 'RECEIPT',
                        productId: item.productId,
                        locationId: receipt.locationId,
                        userId,
                        quantityBefore: oldQuantity,
                        quantityAfter: newQuantity,
                        quantityChanged: item.quantityReceived,
                        referenceId: receipt.id,
                        notes: `Receipt validation: ${receipt.receiptNumber}`
                    }
                });
            }

            return validatedReceipt;
        });

        // Transform receipt to include status field
        const transformedReceipt = {
            ...updatedReceipt,
            status: 'DONE',
            createdBy: receipt.user
        };

        res.json({
            message: 'Receipt validated successfully',
            receipt: transformedReceipt
        });
    } catch (error) {
        console.error('Receipt validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
