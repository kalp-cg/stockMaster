import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllAuditLogs = async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '50',
            action,
            entity,
            userId,
            startDate,
            endDate
        } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
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

export const getAuditLogById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const log = await prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!log) {
            return res.status(404).json({ error: 'Audit log not found' });
        }

        res.json(log);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAuditStats = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const where: any = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [totalLogs, actionStats, entityStats, userActivity] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: true
            }),
            prisma.auditLog.groupBy({
                by: ['entity'],
                where,
                _count: true,
                orderBy: {
                    _count: {
                        entity: 'desc'
                    }
                },
                take: 10
            }),
            prisma.auditLog.groupBy({
                by: ['userId', 'userName'],
                where,
                _count: true,
                orderBy: {
                    _count: {
                        userId: 'desc'
                    }
                },
                take: 10
            })
        ]);

        res.json({
            totalLogs,
            actionStats: actionStats.map(stat => ({
                action: stat.action,
                count: stat._count
            })),
            entityStats: entityStats.map(stat => ({
                entity: stat.entity,
                count: stat._count
            })),
            userActivity: userActivity.map(stat => ({
                userId: stat.userId,
                userName: stat.userName,
                count: stat._count
            }))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getUserAuditLogs = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where: { userId },
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.auditLog.count({ where: { userId } })
        ]);

        res.json({
            logs,
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

export const getEntityAuditLogs = async (req: Request, res: Response) => {
    try {
        const { entity, entityId } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = { entity };
        if (entityId) where.entityId = entityId;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
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
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
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

export const deleteOldAuditLogs = async (req: Request, res: Response) => {
    try {
        const { days = '90' } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days as string));

        const result = await prisma.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });

        res.json({
            message: `Deleted ${result.count} audit logs older than ${days} days`,
            count: result.count
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
