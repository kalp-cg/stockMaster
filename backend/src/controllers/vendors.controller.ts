import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllVendors = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const skip = (page - 1) * limit;

        const whereClause = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } }
                ]
            }
            : {};

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            receipts: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.vendor.count({ where: whereClause })
        ]);

        res.json({
            vendors,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Vendors GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createVendor = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        if (email) {
            const existingVendor = await prisma.vendor.findFirst({
                where: { email }
            });

            if (existingVendor) {
                res.status(409).json({ error: 'Vendor with this email already exists' });
                return;
            }
        }

        const vendor = await prisma.vendor.create({
            data: {
                name,
                email,
                phone,
                address
            }
        });

        res.status(201).json(vendor);
    } catch (error) {
        console.error('Vendors POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                receipts: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        },
                        location: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!vendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        res.json(vendor);
    } catch (error) {
        console.error('Vendor GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const existingVendor = await prisma.vendor.findUnique({
            where: { id }
        });

        if (!existingVendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (email && email !== existingVendor.email) {
            const emailExists = await prisma.vendor.findFirst({
                where: {
                    email,
                    id: { not: id }
                }
            });

            if (emailExists) {
                res.status(409).json({ error: 'Vendor with this email already exists' });
                return;
            }
        }

        const vendor = await prisma.vendor.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address
            }
        });

        res.json(vendor);
    } catch (error) {
        console.error('Vendor PUT error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingVendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                receipts: true
            }
        });

        if (!existingVendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (existingVendor.receipts.length > 0) {
            res.status(409).json({ error: 'Cannot delete vendor with existing receipts' });
            return;
        }

        await prisma.vendor.delete({
            where: { id }
        });

        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Vendor DELETE error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
