import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    EXPORT = 'EXPORT',
    IMPORT = 'IMPORT',
    VIEW = 'VIEW'
}

interface AuditLogData {
    action: AuditAction;
    entity: string;
    entityId?: string;
    changes?: any;
}

export const logAudit = async (
    req: Request,
    data: AuditLogData
) => {
    try {
        const user = (req as any).user;
        const userId = user?.id;
        const userName = user?.name;
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await prisma.auditLog.create({
            data: {
                userId,
                userName,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                changes: data.changes ? JSON.stringify(data.changes) : null,
                ipAddress,
                userAgent
            }
        });
    } catch (error) {
        console.error('Error logging audit:', error);
    }
};

export const auditMiddleware = (action: AuditAction, entity: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const entityId = body?.id || req.params.id || body?.data?.id;
                
                logAudit(req, {
                    action,
                    entity,
                    entityId,
                    changes: action === AuditAction.UPDATE ? body : undefined
                }).catch(console.error);
            }
            return originalJson(body);
        };

        next();
    };
};
