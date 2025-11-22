import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getMoveHistory = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '20');
        const moveType = req.query.moveType as string;
        const productId = req.query.productId as string;
        const locationId = req.query.locationId as string;
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        if (moveType) {
            whereClause.moveType = moveType;
        }

        if (productId) {
            whereClause.productId = productId;
        }

        if (locationId) {
            whereClause.locationId = locationId;
        }

        const [moveHistory, total] = await Promise.all([
            prisma.moveHistory.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                    location: { select: { id: true, name: true } },
                    user: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.moveHistory.count({ where: whereClause })
        ]);

        res.json({
            moveHistory,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Move history GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
