import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllSettings = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        const where: any = {};
        if (category) where.category = category as string;

        const settings = await prisma.systemSetting.findMany({ where });
        
        // Convert to key-value object
        const settingsObject: any = {};
        settings.forEach(setting => {
            settingsObject[setting.key] = {
                value: setting.value,
                category: setting.category,
                description: setting.description
            };
        });

        res.json(settingsObject);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;

        const setting = await prisma.systemSetting.findUnique({
            where: { key }
        });

        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        res.json(setting);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value, category, description } = req.body;

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: {
                value,
                category: category || 'general',
                description
            },
            create: {
                key,
                value,
                category: category || 'general',
                description
            }
        });

        res.json(setting);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMultipleSettings = async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;

        if (!Array.isArray(settings)) {
            return res.status(400).json({ error: 'Settings must be an array' });
        }

        const results = await Promise.all(
            settings.map(({ key, value, category, description }: any) =>
                prisma.systemSetting.upsert({
                    where: { key },
                    update: { value, category: category || 'general', description },
                    create: { key, value, category: category || 'general', description }
                })
            )
        );

        res.json({ message: 'Settings updated successfully', count: results.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;

        await prisma.systemSetting.delete({
            where: { key }
        });

        res.json({ message: 'Setting deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCompanyInfo = async (req: Request, res: Response) => {
    try {
        const companyInfo = await prisma.companyInfo.findFirst();

        if (!companyInfo) {
            return res.status(404).json({ error: 'Company info not found' });
        }

        res.json(companyInfo);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCompanyInfo = async (req: Request, res: Response) => {
    try {
        const {
            companyName,
            address,
            city,
            state,
            zipCode,
            country,
            phone,
            email,
            website,
            taxId,
            logo,
            currency
        } = req.body;

        // Check if company info exists
        const existing = await prisma.companyInfo.findFirst();

        let companyInfo;
        if (existing) {
            companyInfo = await prisma.companyInfo.update({
                where: { id: existing.id },
                data: {
                    companyName,
                    address,
                    city,
                    state,
                    zipCode,
                    country,
                    phone,
                    email,
                    website,
                    taxId,
                    logo,
                    currency
                }
            });
        } else {
            companyInfo = await prisma.companyInfo.create({
                data: {
                    companyName,
                    address,
                    city,
                    state,
                    zipCode,
                    country,
                    phone,
                    email,
                    website,
                    taxId,
                    logo,
                    currency
                }
            });
        }

        res.json(companyInfo);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const initializeDefaultSettings = async (req: Request, res: Response) => {
    try {
        const defaultSettings = [
            { key: 'low_stock_threshold', value: '10', category: 'inventory', description: 'Default low stock threshold for products' },
            { key: 'critical_stock_threshold', value: '5', category: 'inventory', description: 'Critical stock level threshold' },
            { key: 'enable_email_notifications', value: 'false', category: 'notifications', description: 'Enable email notifications' },
            { key: 'enable_low_stock_alerts', value: 'true', category: 'notifications', description: 'Enable low stock alerts' },
            { key: 'auto_generate_alerts', value: 'true', category: 'system', description: 'Automatically generate alerts' },
            { key: 'date_format', value: 'MM/DD/YYYY', category: 'general', description: 'Date format for display' },
            { key: 'timezone', value: 'America/New_York', category: 'general', description: 'System timezone' },
            { key: 'items_per_page', value: '20', category: 'general', description: 'Default items per page' },
            { key: 'invoice_prefix', value: 'INV-', category: 'invoices', description: 'Invoice number prefix' },
            { key: 'payment_prefix', value: 'PAY-', category: 'invoices', description: 'Payment number prefix' },
            { key: 'default_tax_rate', value: '0', category: 'invoices', description: 'Default tax rate percentage' },
            { key: 'invoice_due_days', value: '30', category: 'invoices', description: 'Default invoice due days' }
        ];

        const results = await Promise.all(
            defaultSettings.map(setting =>
                prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: {},
                    create: setting
                })
            )
        );

        res.json({ message: 'Default settings initialized', count: results.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
