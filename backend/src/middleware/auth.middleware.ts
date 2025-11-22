import { Request, Response, NextFunction } from 'express';
import { getTokenFromRequest, getUserFromToken } from '../lib/auth';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await getUserFromToken(token);

        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        (req as AuthenticatedRequest).user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
