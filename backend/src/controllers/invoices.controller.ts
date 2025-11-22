import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import PDFDocument from 'pdfkit';

export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '20', status, customerId } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (status) where.status = status;
        if (customerId) where.customerId = customerId;

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    unit: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({
            invoices,
            pagination: {
                total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unit: true
                            }
                        }
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const {
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            items,
            taxRate,
            discount,
            dueDate,
            notes
        } = req.body;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Invoice must have at least one item' });
        }

        // Generate invoice number
        const lastInvoice = await prisma.invoice.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { invoiceNumber: true }
        });

        let invoiceNumber = 'INV-000001';
        if (lastInvoice) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
            invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;
        }

        // Calculate amounts
        let subtotal = 0;
        const invoiceItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) {
                return res.status(404).json({ error: `Product ${item.productId} not found` });
            }

            const unitPrice = item.unitPrice || product.price;
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;

            invoiceItems.push({
                productId: item.productId,
                description: item.description || product.name,
                quantity: item.quantity,
                unitPrice,
                totalPrice
            });
        }

        const taxAmount = (subtotal * (taxRate || 0)) / 100;
        const discountAmount = discount || 0;
        const totalAmount = subtotal + taxAmount - discountAmount;

        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                customerName,
                customerEmail,
                customerPhone,
                customerAddress,
                userId,
                subtotal,
                taxRate: taxRate || 0,
                taxAmount,
                discount: discountAmount,
                totalAmount,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes,
                items: {
                    create: invoiceItems
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.status(201).json(invoice);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, paidDate, notes } = req.body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (paidDate) updateData.paidDate = new Date(paidDate);
        if (notes !== undefined) updateData.notes = notes;

        const invoice = await prisma.invoice.update({
            where: { id },
            data: updateData,
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.json(invoice);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.invoice.delete({
            where: { id }
        });

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const generateInvoicePDF = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(24).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Company Info (left side)
        doc.fontSize(10).text('StockMaster Inc.', 50, 120);
        doc.text('123 Business Street');
        doc.text('City, State 12345');
        doc.text('Phone: (123) 456-7890');
        doc.text('Email: info@stockmaster.com');

        // Invoice Details (right side)
        doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 120);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 350);
        if (invoice.dueDate) {
            doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350);
        }
        doc.text(`Status: ${invoice.status}`, 350);

        doc.moveDown(2);

        // Customer Info
        doc.fontSize(12).text('Bill To:', 50);
        doc.fontSize(10).text(invoice.customerName);
        if (invoice.customerEmail) doc.text(invoice.customerEmail);
        if (invoice.customerPhone) doc.text(invoice.customerPhone);
        if (invoice.customerAddress) doc.text(invoice.customerAddress);

        doc.moveDown(2);

        // Table Header
        const tableTop = 300;
        doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
        
        doc.text('Item', 50, tableTop);
        doc.text('Quantity', 250, tableTop);
        doc.text('Unit Price', 350, tableTop);
        doc.text('Total', 480, tableTop, { align: 'right' });
        doc.font('Helvetica');

        // Draw line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Items
        let yPosition = tableTop + 30;
        invoice.items.forEach((item) => {
            doc.fontSize(9).text(item.description || item.product.name, 50, yPosition, { width: 180 });
            doc.text(`${item.quantity} ${item.product.unit}`, 250, yPosition);
            doc.text(`$${item.unitPrice.toFixed(2)}`, 350, yPosition);
            doc.text(`$${item.totalPrice.toFixed(2)}`, 480, yPosition, { align: 'right' });
            yPosition += 25;
        });

        // Draw line before totals
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

        // Totals
        yPosition += 20;
        doc.fontSize(10);
        doc.text('Subtotal:', 380, yPosition);
        doc.text(`$${invoice.subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

        if (invoice.taxAmount > 0) {
            yPosition += 20;
            doc.text(`Tax (${invoice.taxRate}%):`, 380, yPosition);
            doc.text(`$${invoice.taxAmount.toFixed(2)}`, 480, yPosition, { align: 'right' });
        }

        if (invoice.discount > 0) {
            yPosition += 20;
            doc.text('Discount:', 380, yPosition);
            doc.text(`-$${invoice.discount.toFixed(2)}`, 480, yPosition, { align: 'right' });
        }

        yPosition += 20;
        doc.fontSize(12).fillColor('#000').font('Helvetica-Bold');
        doc.text('Total Amount:', 380, yPosition);
        doc.text(`$${invoice.totalAmount.toFixed(2)}`, 480, yPosition, { align: 'right' });
        doc.font('Helvetica');

        // Notes
        if (invoice.notes) {
            yPosition += 40;
            doc.fontSize(10).fillColor('#666');
            doc.text('Notes:', 50, yPosition);
            doc.fontSize(9).text(invoice.notes, 50, yPosition + 15, { width: 500 });
        }

        // Footer
        doc.fontSize(8).fillColor('#999').text(
            'Thank you for your business!',
            50,
            700,
            { align: 'center', width: 500 }
        );

        doc.end();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getInvoiceStats = async (req: Request, res: Response) => {
    try {
        const [total, draft, sent, paid, overdue] = await Promise.all([
            prisma.invoice.count(),
            prisma.invoice.count({ where: { status: 'DRAFT' } }),
            prisma.invoice.count({ where: { status: 'SENT' } }),
            prisma.invoice.count({ where: { status: 'PAID' } }),
            prisma.invoice.count({ where: { status: 'OVERDUE' } })
        ]);

        const totalRevenue = await prisma.invoice.aggregate({
            where: { status: 'PAID' },
            _sum: { totalAmount: true }
        });

        const pendingRevenue = await prisma.invoice.aggregate({
            where: { status: { in: ['SENT', 'OVERDUE'] } },
            _sum: { totalAmount: true }
        });

        res.json({
            total,
            byStatus: {
                draft,
                sent,
                paid,
                overdue
            },
            revenue: {
                total: totalRevenue._sum.totalAmount || 0,
                pending: pendingRevenue._sum.totalAmount || 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
