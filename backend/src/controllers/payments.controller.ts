import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '20', invoiceId } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (invoiceId) where.invoiceId = invoiceId as string;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                include: {
                    invoice: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            customerName: true,
                            totalAmount: true,
                            paidAmount: true,
                            balanceAmount: true,
                            status: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.payment.count({ where })
        ]);

        res.json({
            payments,
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

export const getPaymentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        customerName: true,
                        totalAmount: true,
                        paidAmount: true,
                        balanceAmount: true,
                        status: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(payment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { invoiceId, amount, paymentMethod, transactionId, notes } = req.body;

        // Validate invoice exists
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Validate payment amount
        if (amount <= 0) {
            return res.status(400).json({ error: 'Payment amount must be greater than 0' });
        }

        const remainingBalance = invoice.totalAmount - invoice.paidAmount;
        if (amount > remainingBalance) {
            return res.status(400).json({ 
                error: `Payment amount exceeds remaining balance of $${remainingBalance.toFixed(2)}` 
            });
        }

        // Generate payment number
        const lastPayment = await prisma.payment.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { paymentNumber: true }
        });

        let paymentNumber = 'PAY-000001';
        if (lastPayment) {
            const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[1]);
            paymentNumber = `PAY-${String(lastNumber + 1).padStart(6, '0')}`;
        }

        // Create payment and update invoice in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create payment
            const payment = await tx.payment.create({
                data: {
                    paymentNumber,
                    invoiceId,
                    amount,
                    paymentMethod,
                    transactionId,
                    notes,
                    userId
                },
                include: {
                    invoice: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            // Update invoice amounts
            const newPaidAmount = invoice.paidAmount + amount;
            const newBalanceAmount = invoice.totalAmount - newPaidAmount;
            
            let newStatus = invoice.status;
            if (newBalanceAmount === 0) {
                newStatus = 'PAID';
            } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
                newStatus = 'PARTIAL';
            }

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    balanceAmount: newBalanceAmount,
                    status: newStatus,
                    paidDate: newBalanceAmount === 0 ? new Date() : null
                }
            });

            return payment;
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: { invoice: true }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Delete payment and update invoice in transaction
        await prisma.$transaction(async (tx) => {
            // Delete payment
            await tx.payment.delete({
                where: { id }
            });

            // Update invoice amounts
            const newPaidAmount = payment.invoice.paidAmount - payment.amount;
            const newBalanceAmount = payment.invoice.totalAmount - newPaidAmount;
            
            let newStatus = payment.invoice.status;
            if (newBalanceAmount === payment.invoice.totalAmount) {
                newStatus = 'SENT';
            } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
                newStatus = 'PARTIAL';
            }

            await tx.invoice.update({
                where: { id: payment.invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    balanceAmount: newBalanceAmount,
                    status: newStatus,
                    paidDate: null
                }
            });
        });

        res.json({ message: 'Payment deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentStats = async (req: Request, res: Response) => {
    try {
        const [totalPayments, totalAmount, cashPayments, cardPayments] = await Promise.all([
            prisma.payment.count(),
            prisma.payment.aggregate({
                _sum: { amount: true }
            }),
            prisma.payment.count({ where: { paymentMethod: 'CASH' } }),
            prisma.payment.count({ 
                where: { 
                    paymentMethod: { in: ['CREDIT_CARD', 'DEBIT_CARD'] } 
                } 
            })
        ]);

        // Get payment methods breakdown
        const paymentsByMethod = await prisma.payment.groupBy({
            by: ['paymentMethod'],
            _sum: { amount: true },
            _count: true
        });

        // Get outstanding invoices
        const outstandingInvoices = await prisma.invoice.count({
            where: { 
                status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } 
            }
        });

        const outstandingAmount = await prisma.invoice.aggregate({
            where: { 
                status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } 
            },
            _sum: { balanceAmount: true }
        });

        res.json({
            totalPayments,
            totalAmount: totalAmount._sum.amount || 0,
            paymentsByMethod: paymentsByMethod.map(p => ({
                method: p.paymentMethod,
                count: p._count,
                amount: p._sum.amount || 0
            })),
            outstanding: {
                invoices: outstandingInvoices,
                amount: outstandingAmount._sum.balanceAmount || 0
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getInvoicePayments = async (req: Request, res: Response) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.customerName,
                totalAmount: invoice.totalAmount,
                paidAmount: invoice.paidAmount,
                balanceAmount: invoice.balanceAmount,
                status: invoice.status
            },
            payments: invoice.payments
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
