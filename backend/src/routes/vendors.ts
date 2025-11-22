import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requirePermission, Permission } from '../middleware/rbac.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all vendors with receipt summary
router.get('/', authenticate, requirePermission(Permission.VIEW_VENDORS), async (req, res) => {
    try {
        const { search = '' } = req.query;
        
        const where: any = {
            ...(search && {
                OR: [
                    { name: { contains: String(search) } },
                    { email: { contains: String(search) } },
                    { phone: { contains: String(search) } }
                ]
            })
        };

        const vendors = await prisma.vendor.findMany({
            where,
            include: {
                receipts: {
                    include: {
                        items: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: {
                        receipts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const vendorsWithSummary = vendors.map(vendor => ({
            ...vendor,
            totalReceipts: vendor._count.receipts,
            totalItemsReceived: vendor.receipts.reduce((sum, receipt) => 
                sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantityReceived, 0), 0
            ),
            lastReceiptDate: vendor.receipts[0]?.createdAt || null
        }));

        res.json({ vendors: vendorsWithSummary });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

// Get vendor by ID with detailed receipt history
router.get('/:id', authenticate, requirePermission(Permission.VIEW_VENDORS), async (req, res) => {
    try {
        const { id } = req.params;
        
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                receipts: {
                    include: {
                        items: {
                            include: {
                                product: { select: { name: true, sku: true } }
                            }
                        },
                        location: { select: { name: true } },
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        receipts: true
                    }
                }
            }
        });

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const summary = {
            totalReceipts: vendor._count.receipts,
            totalItemsReceived: vendor.receipts.reduce((sum, receipt) => 
                sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantityReceived, 0), 0
            ),
            uniqueProductsSupplied: new Set(
                vendor.receipts.flatMap(receipt => 
                    receipt.items.map(item => item.productId)
                )
            ).size,
            validatedReceipts: vendor.receipts.filter(receipt => receipt.isValidated).length,
            pendingReceipts: vendor.receipts.filter(receipt => !receipt.isValidated).length
        };

        res.json({
            ...vendor,
            summary
        });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({ error: 'Failed to fetch vendor' });
    }
});

// Create new vendor
router.post('/', authenticate, requirePermission(Permission.CREATE_VENDORS), async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if vendor name already exists
        const existingVendor = await prisma.vendor.findFirst({
            where: { name: name.trim() }
        });

        if (existingVendor) {
            return res.status(400).json({ error: 'Vendor name already exists' });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await prisma.vendor.findFirst({
                where: { email: email.trim() }
            });

            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        const vendor = await prisma.vendor.create({
            data: {
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                address: address?.trim() || null
            }
        });

        res.status(201).json({
            message: 'Vendor created successfully',
            vendor
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

// Update vendor
router.put('/:id', authenticate, requirePermission(Permission.UPDATE_VENDORS), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        const existingVendor = await prisma.vendor.findUnique({
            where: { id }
        });

        if (!existingVendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Check if new name already exists for other vendors
        if (name && name !== existingVendor.name) {
            const nameExists = await prisma.vendor.findFirst({
                where: { 
                    name: name.trim(),
                    id: { not: id }
                }
            });

            if (nameExists) {
                return res.status(400).json({ error: 'Vendor name already exists' });
            }
        }

        // Check if new email already exists for other vendors
        if (email && email !== existingVendor.email) {
            const emailExists = await prisma.vendor.findFirst({
                where: { 
                    email: email.trim(),
                    id: { not: id }
                }
            });

            if (emailExists) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        const updatedVendor = await prisma.vendor.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(email !== undefined && { email: email?.trim() || null }),
                ...(phone !== undefined && { phone: phone?.trim() || null }),
                ...(address !== undefined && { address: address?.trim() || null })
            }
        });

        res.json({
            message: 'Vendor updated successfully',
            vendor: updatedVendor
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
});

// Delete vendor
router.delete('/:id', authenticate, requirePermission(Permission.DELETE_VENDORS), async (req, res) => {
    try {
        const { id } = req.params;

        const existingVendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        receipts: true
                    }
                }
            }
        });

        if (!existingVendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Check if vendor has any receipts
        if (existingVendor._count.receipts > 0) {
            return res.status(400).json({
                error: 'Cannot delete vendor that has receipt history'
            });
        }

        await prisma.vendor.delete({
            where: { id }
        });

        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
});

// Get vendor performance stats
router.get('/:id/stats', authenticate, requirePermission(Permission.VIEW_VENDORS), async (req, res) => {
    try {
        const { id } = req.params;
        const { months = 6 } = req.query;

        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - Number(months));

        const receipts = await prisma.receiptOrder.findMany({
            where: {
                vendorId: id,
                createdAt: { gte: monthsAgo }
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, sku: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by month
        const monthlyStats = receipts.reduce((acc: any, receipt) => {
            const monthKey = receipt.createdAt.toISOString().slice(0, 7); // YYYY-MM
            
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: monthKey,
                    receipts: 0,
                    totalItems: 0,
                    validatedReceipts: 0
                };
            }
            
            acc[monthKey].receipts++;
            acc[monthKey].totalItems += receipt.items.reduce((sum, item) => sum + item.quantityReceived, 0);
            if (receipt.isValidated) acc[monthKey].validatedReceipts++;
            
            return acc;
        }, {});

        const stats = {
            totalReceipts: receipts.length,
            totalItems: receipts.reduce((sum, receipt) => 
                sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantityReceived, 0), 0
            ),
            validationRate: receipts.length > 0 ? 
                (receipts.filter(r => r.isValidated).length / receipts.length * 100).toFixed(1) : '0',
            avgItemsPerReceipt: receipts.length > 0 ?
                (receipts.reduce((sum, receipt) => sum + receipt.totalItems, 0) / receipts.length).toFixed(1) : '0',
            monthlyData: Object.values(monthlyStats)
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching vendor stats:', error);
        res.status(500).json({ error: 'Failed to fetch vendor stats' });
    }
});

export default router;