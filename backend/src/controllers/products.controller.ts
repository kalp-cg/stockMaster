import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string || '1');
        const limit = parseInt(req.query.limit as string || '10');
        const skip = (page - 1) * limit;

        const whereClause = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { sku: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } }
                ]
            }
            : {};

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    stocks: {
                        include: {
                            location: true
                        }
                    },
                    _count: {
                        select: {
                            receiptItems: true,
                            deliveryItems: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where: whereClause })
        ]);

        const enrichedProducts = products.map((product) => {
            const totalStock = product.stocks.reduce((sum: number, stock: any) => sum + stock.quantity, 0);
            const isLowStock = totalStock <= product.minStock;

            return {
                ...product,
                totalStock,
                isLowStock
            };
        });

        res.json({
            products: enrichedProducts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Products GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, sku, unit, minStock } = req.body;

        if (!name || !sku || !unit) {
            res.status(400).json({ error: 'Name, SKU, and unit are required' });
            return;
        }

        const existingProduct = await prisma.product.findUnique({
            where: { sku }
        });

        if (existingProduct) {
            res.status(409).json({ error: 'Product with this SKU already exists' });
            return;
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                sku,
                unit,
                minStock: minStock || 0
            }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Products POST error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                stocks: {
                    include: {
                        location: true
                    }
                }
            }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        const totalStock = product.stocks.reduce((sum: number, stock: any) => sum + stock.quantity, 0);
        const isLowStock = totalStock <= product.minStock;

        res.json({
            ...product,
            totalStock,
            isLowStock
        });
    } catch (error) {
        console.error('Product GET error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, sku, unit, minStock } = req.body;

        if (!name || !sku || !unit) {
            res.status(400).json({ error: 'Name, SKU, and unit are required' });
            return;
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (sku !== existingProduct.sku) {
            const skuExists = await prisma.product.findUnique({
                where: { sku }
            });

            if (skuExists) {
                res.status(409).json({ error: 'Product with this SKU already exists' });
                return;
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                sku,
                unit,
                minStock: minStock || 0
            }
        });

        res.json(product);
    } catch (error) {
        console.error('Product PUT error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                stocks: true,
                receiptItems: true,
                deliveryItems: true
            }
        });

        if (!existingProduct) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        const hasStock = existingProduct.stocks.some((stock: any) => stock.quantity > 0);
        const hasTransactions = existingProduct.receiptItems.length > 0 || existingProduct.deliveryItems.length > 0;

        if (hasStock || hasTransactions) {
            res.status(409).json({ error: 'Cannot delete product with existing stock or transaction history' });
            return;
        }

        await prisma.product.delete({
            where: { id }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Product DELETE error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
