import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/rbac.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get all receipts
router.get('/', authenticate, async (req, res) => {
  try {
    const receipts = await prisma.receiptOrder.findMany({
      include: {
        vendor: true,
        location: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ receipts });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Get single receipt
router.get('/:id', authenticate, async (req, res) => {
  try {
    const receipt = await prisma.receiptOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        location: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ receipt });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Create new receipt
router.post('/', authenticate, requirePermission(Permission.CREATE_RECEIPTS), async (req, res) => {
  try {
    const { vendorId, locationId, notes, items } = req.body;
    const userId = (req as any).user.userId;

    if (!vendorId || !locationId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate receipt number
    const count = await prisma.receiptOrder.count();
    const receiptNumber = `RCP-${String(count + 1).padStart(6, '0')}`;

    // Create receipt with items
    const receipt = await prisma.receiptOrder.create({
      data: {
        receiptNumber,
        vendorId,
        locationId,
        userId,
        totalItems: items.length,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantityReceived: parseInt(item.quantity),
          })),
        },
      },
      include: {
        vendor: true,
        location: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({ receipt, message: 'Receipt created successfully' });
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

// Validate receipt (adds stock)
router.post('/:id/validate', authenticate, requirePermission(Permission.VALIDATE_RECEIPTS), async (req, res) => {
  try {
    const receiptId = req.params.id;
    const userId = (req as any).user.userId;

    const receipt = await prisma.receiptOrder.findUnique({
      where: { id: receiptId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (receipt.isValidated) {
      return res.status(400).json({ error: 'Receipt already validated' });
    }

    // Update stock for each item and create move history
    for (const item of receipt.items) {
      // Find or create stock record
      const existingStock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: receipt.locationId,
          },
        },
      });

      const oldQuantity = existingStock?.quantity || 0;
      const newQuantity = oldQuantity + item.quantityReceived;

      await prisma.stock.upsert({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: receipt.locationId,
          },
        },
        update: {
          quantity: newQuantity,
        },
        create: {
          productId: item.productId,
          locationId: receipt.locationId,
          quantity: item.quantityReceived,
        },
      });

      // Create move history
      await prisma.moveHistory.create({
        data: {
          moveType: 'RECEIPT',
          productId: item.productId,
          locationId: receipt.locationId,
          userId,
          quantityBefore: oldQuantity,
          quantityAfter: newQuantity,
          quantityChanged: item.quantityReceived,
          referenceId: receiptId,
          notes: `Receipt ${receipt.receiptNumber} validated`,
        },
      });
    }

    // Mark receipt as validated
    const updatedReceipt = await prisma.receiptOrder.update({
      where: { id: receiptId },
      data: {
        isValidated: true,
        validatedAt: new Date(),
      },
      include: {
        vendor: true,
        location: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({ receipt: updatedReceipt, message: 'Receipt validated and stock updated' });
  } catch (error) {
    console.error('Error validating receipt:', error);
    res.status(500).json({ error: 'Failed to validate receipt' });
  }
});

// Delete receipt (only if not validated)
router.delete('/:id', authenticate, requirePermission(Permission.CREATE_RECEIPTS), async (req, res) => {
  try {
    const receipt = await prisma.receiptOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (receipt.isValidated) {
      return res.status(400).json({ error: 'Cannot delete validated receipt' });
    }

    await prisma.receiptOrder.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

export default router;
