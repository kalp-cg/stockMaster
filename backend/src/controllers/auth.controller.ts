import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken, getTokenFromRequest, getUserFromToken } from '../lib/auth';
import { sendEmail } from '../lib/email';
import { logAudit, AuditAction } from '../middleware/audit.middleware';

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required' });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'STAFF'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        const token = generateToken(user.id);

        res.status(201).json({
            message: 'User created successfully',
            user,
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isValidPassword = await verifyPassword(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken(user.id);

        // Log successful login
        await logAudit(req, {
            action: AuditAction.LOGIN,
            entity: 'User',
            entityId: user.id
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logout = async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user) {
        await logAudit(req, {
            action: AuditAction.LOGOUT,
            entity: 'User',
            entityId: user.id
        });
    }
    res.json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const user = await getUserFromToken(token);

        if (!user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: otp,
                resetPasswordExpires: otpExpires,
            },
        });

        // Send Email
        try {
            await sendEmail(
                email,
                'Password Reset OTP',
                `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
            );
        } catch (emailError) {
            console.error("Failed to send email", emailError);
            return res.status(500).json({ error: 'Failed to send OTP email. Check server logs/env.' });
        }

        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        if (user.resetPasswordToken !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
