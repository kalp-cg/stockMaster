import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requirePermission, Permission } from '../middleware/rbac.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all products with stock information
router.get('/', authenticate, requirePermission(Permission.VIEW_PRODUCTS), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', locationId = '' } = req.query;
        
        const skip = (Number(page) - 1) * Number(limit);
        
        const where: any = {
            ...(search && {
                OR: [
                    { name: { contains: String(search) } },
                    { sku: { contains: String(search) } },
                    { description: { contains: String(search) } }
                ]
            })
        };

        const products = await prisma.product.findMany({
            where,
            skip,
            take: Number(limit),
            include: {
                stocks: {
                    include: {
                        location: true
                    },
                    ...(locationId && {
                        where: {
                            locationId: String(locationId)
                        }
                    })
                },
                _count: {
                    select: {
                        stocks: true,
                        receiptItems: true,
                        deliveryItems: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate total stock across all locations
        const productsWithTotalStock = products.map(product => ({
            ...product,
            totalStock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
            stockByLocation: product.stocks.map(stock => ({
                locationId: stock.locationId,
                locationName: stock.location.name,
                quantity: stock.quantity
            }))
        }));

        const total = await prisma.product.count({ where });

        res.json({
            products: productsWithTotalStock,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product by ID
router.get('/:id', authenticate, requirePermission(Permission.VIEW_PRODUCTS), async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                stocks: {
                    include: {
                        location: true
                    }
                },
                moveHistory: {
                    include: {
                        user: { select: { name: true, email: true } },
                        location: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                _count: {
                    select: {
                        receiptItems: true,
                        deliveryItems: true,
                        moveHistory: true
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

        res.json({
            ...product,
            totalStock,
            stockByLocation: product.stocks.map(stock => ({
                locationId: stock.locationId,
                locationName: stock.location.name,
                quantity: stock.quantity
            }))
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product
router.post('/', authenticate, requirePermission(Permission.CREATE_PRODUCTS), async (req, res) => {
    try {
        const { name, description, sku, unit, minStock } = req.body;

        // Validate required fields
        if (!name || !sku || !unit) {
            return res.status(400).json({ error: 'Name, SKU, and unit are required' });
        }

        // Check if SKU already exists
        const existingSku = await prisma.product.findUnique({
            where: { sku }
        });

        if (existingSku) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                sku: sku.trim().toUpperCase(),
                unit: unit.trim(),
                minStock: parseInt(minStock) || 0
            }
        });

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', authenticate, requirePermission(Permission.UPDATE_PRODUCTS), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sku, unit, minStock } = req.body;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if SKU already exists for other products
        if (sku && sku !== existingProduct.sku) {
            const existingSku = await prisma.product.findUnique({
                where: { sku }
            });

            if (existingSku) {
                return res.status(400).json({ error: 'SKU already exists' });
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(sku && { sku: sku.trim().toUpperCase() }),
                ...(unit && { unit: unit.trim() }),
                ...(minStock !== undefined && { minStock: parseInt(minStock) || 0 })
            }
        });

        res.json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_PRODUCTS), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        stocks: true,
                        receiptItems: true,
                        deliveryItems: true,
                        moveHistory: true
                    }
                }
            }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if product has any stock or transactions
        const hasStockOrTransactions = existingProduct._count.stocks > 0 ||
                                     existingProduct._count.receiptItems > 0 ||
                                     existingProduct._count.deliveryItems > 0 ||
                                     existingProduct._count.moveHistory > 0;

        if (hasStockOrTransactions) {
            return res.status(400).json({ 
                error: 'Cannot delete product that has stock or transaction history' 
            });
        }

        await prisma.product.delete({
            where: { id }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get low stock products
router.get('/alerts/low-stock', authenticate, requirePermission(Permission.VIEW_PRODUCTS), async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                stocks: {
                    include: {
                        location: true
                    }
                }
            }
        });

        const lowStockProducts = products
            .map(product => ({
                ...product,
                totalStock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
            }))
            .filter(product => product.totalStock <= product.minStock)
            .sort((a, b) => (a.totalStock - a.minStock) - (b.totalStock - b.minStock));

        res.json({
            lowStockProducts,
            count: lowStockProducts.length
        });
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
});

export default router;