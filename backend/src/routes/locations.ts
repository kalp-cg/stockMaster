import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requirePermission, Permission } from '../middleware/rbac.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all locations with stock summary
router.get('/', authenticate, requirePermission(Permission.VIEW_LOCATIONS), async (req, res) => {
    try {
        const locations = await prisma.location.findMany({
            include: {
                stocks: {
                    include: {
                        product: true
                    }
                },
                _count: {
                    select: {
                        stocks: true,
                        receipts: true,
                        deliveries: true,
                        transfersFrom: true,
                        transfersTo: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const locationsWithSummary = locations.map(location => ({
            ...location,
            totalProducts: location.stocks.length,
            totalStock: location.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
            stockValue: location.stocks.length, // Could be calculated with product prices if available
            lowStockProducts: location.stocks.filter(stock => 
                stock.quantity <= stock.product.minStock
            ).length
        }));

        res.json({ locations: locationsWithSummary });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// Get location by ID with detailed stock info
router.get('/:id', authenticate, requirePermission(Permission.VIEW_LOCATIONS), async (req, res) => {
    try {
        const { id } = req.params;
        
        const location = await prisma.location.findUnique({
            where: { id },
            include: {
                stocks: {
                    include: {
                        product: true
                    },
                    orderBy: {
                        product: { name: 'asc' }
                    }
                },
                receipts: {
                    include: {
                        vendor: true,
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                deliveries: {
                    include: {
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                transfersFrom: {
                    include: {
                        toLocation: { select: { name: true } },
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                transfersTo: {
                    include: {
                        fromLocation: { select: { name: true } },
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: {
                        stocks: true,
                        receipts: true,
                        deliveries: true,
                        transfersFrom: true,
                        transfersTo: true
                    }
                }
            }
        });

        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const summary = {
            totalProducts: location.stocks.length,
            totalStock: location.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
            lowStockProducts: location.stocks.filter(stock => 
                stock.quantity <= stock.product.minStock
            )
        };

        res.json({
            ...location,
            summary
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ error: 'Failed to fetch location' });
    }
});

// Create new location
router.post('/', authenticate, requirePermission(Permission.CREATE_LOCATIONS), async (req, res) => {
    try {
        const { name, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if location name already exists
        const existingLocation = await prisma.location.findFirst({
            where: { name: name.trim() }
        });

        if (existingLocation) {
            return res.status(400).json({ error: 'Location name already exists' });
        }

        const location = await prisma.location.create({
            data: {
                name: name.trim(),
                address: address?.trim() || null
            }
        });

        res.status(201).json({
            message: 'Location created successfully',
            location
        });
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ error: 'Failed to create location' });
    }
});

// Update location
router.put('/:id', authenticate, requirePermission(Permission.UPDATE_LOCATIONS), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address } = req.body;

        const existingLocation = await prisma.location.findUnique({
            where: { id }
        });

        if (!existingLocation) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // Check if new name already exists for other locations
        if (name && name !== existingLocation.name) {
            const nameExists = await prisma.location.findFirst({
                where: { 
                    name: name.trim(),
                    id: { not: id }
                }
            });

            if (nameExists) {
                return res.status(400).json({ error: 'Location name already exists' });
            }
        }

        const updatedLocation = await prisma.location.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(address !== undefined && { address: address?.trim() || null })
            }
        });

        res.json({
            message: 'Location updated successfully',
            location: updatedLocation
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// Delete location
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_LOCATIONS), async (req, res) => {
    try {
        const { id } = req.params;

        const existingLocation = await prisma.location.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        stocks: true,
                        receipts: true,
                        deliveries: true,
                        transfersFrom: true,
                        transfersTo: true,
                        adjustments: true
                    }
                }
            }
        });

        if (!existingLocation) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // Check if location has any stock or transactions
        const hasData = existingLocation._count.stocks > 0 ||
                       existingLocation._count.receipts > 0 ||
                       existingLocation._count.deliveries > 0 ||
                       existingLocation._count.transfersFrom > 0 ||
                       existingLocation._count.transfersTo > 0 ||
                       existingLocation._count.adjustments > 0;

        if (hasData) {
            return res.status(400).json({
                error: 'Cannot delete location that has stock or transaction history'
            });
        }

        await prisma.location.delete({
            where: { id }
        });

        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({ error: 'Failed to delete location' });
    }
});

// Get location movements
router.get('/:id/movements', authenticate, requirePermission(Permission.VIEW_LOCATIONS), async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (Number(page) - 1) * Number(limit);

        const movements = await prisma.moveHistory.findMany({
            where: { locationId: id },
            include: {
                product: { select: { name: true, sku: true } },
                user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit)
        });

        const total = await prisma.moveHistory.count({
            where: { locationId: id }
        });

        res.json({
            movements,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching location movements:', error);
        res.status(500).json({ error: 'Failed to fetch location movements' });
    }
});

export default router;