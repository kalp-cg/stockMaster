import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllLocations = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const skip = (page - 1) * limit;

        const whereClause = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { address: { contains: search, mode: 'insensitive' as const } }
                ]
            }
            : {};

        const [locations, total] = await Promise.all([
            prisma.location.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            stocks: true,
                            receipts: true,
                            deliveries: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.location.count({ where: whereClause })
        ]);

        res.json({
            locations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Locations GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        const { name, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const existingLocation = await prisma.location.findFirst({
            where: { name }
        });

        if (existingLocation) {
            res.status(409).json({ error: 'Location with this name already exists' });
            return;
        }

        const location = await prisma.location.create({
            data: {
                name,
                address
            }
        });

        res.status(201).json(location);
    } catch (error) {
        console.error('Locations POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const location = await prisma.location.findUnique({
            where: { id },
            include: {
                stocks: {
                    include: {
                        product: true
                    },
                    where: {
                        quantity: { gt: 0 }
                    }
                }
            }
        });

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        res.json(location);
    } catch (error) {
        console.error('Location GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const existingLocation = await prisma.location.findUnique({
            where: { id }
        });

        if (!existingLocation) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        if (name !== existingLocation.name) {
            const nameExists = await prisma.location.findFirst({
                where: {
                    name,
                    id: { not: id }
                }
            });

            if (nameExists) {
                res.status(409).json({ error: 'Location with this name already exists' });
                return;
            }
        }

        const location = await prisma.location.update({
            where: { id },
            data: {
                name,
                address
            }
        });

        res.json(location);
    } catch (error) {
        console.error('Location PUT error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getLocationStocks = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const stocks = await prisma.stock.findMany({
            where: { locationId: id },
            include: {
                product: true
            }
        });

        res.json({ stocks });
    } catch (error) {
        console.error('Location stocks GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingLocation = await prisma.location.findUnique({
            where: { id },
            include: {
                stocks: true,
                receipts: true,
                deliveries: true
            }
        });

        if (!existingLocation) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        const hasStock = existingLocation.stocks.some((stock: any) => stock.quantity > 0);
        const hasTransactions = existingLocation.receipts.length > 0 || existingLocation.deliveries.length > 0;

        if (hasStock || hasTransactions) {
            res.status(409).json({ error: 'Cannot delete location with existing stock or transactions' });
            return;
        }

        await prisma.location.delete({
            where: { id }
        });

        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Location DELETE error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
