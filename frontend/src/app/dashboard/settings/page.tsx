'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Building2, Bell, FileText, Database, Check, X } from 'lucide-react';

interface CompanyInfo {
    companyName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    currency: string;
}

interface SystemSettings {
    [key: string]: {
        value: string;
        category: string;
        description?: string;
    };
}

export default function SettingsPage() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<string>('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Company Info State
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
        companyName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        currency: 'USD'
    });

    // System Settings State
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({});
    const [settingsForm, setSettingsForm] = useState({
        low_stock_threshold: '10',
        critical_stock_threshold: '5',
        enable_email_notifications: 'false',
        enable_low_stock_alerts: 'true',
        auto_generate_alerts: 'true',
        date_format: 'MM/DD/YYYY',
        timezone: 'America/New_York',
        items_per_page: '20',
        invoice_prefix: 'INV-',
        payment_prefix: 'PAY-',
        default_tax_rate: '0',
        invoice_due_days: '30'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            await Promise.all([fetchCompanyInfo(), fetchSettings()]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const response = await fetch('/api/settings/company', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCompanyInfo(data);
            }
        } catch (error) {
            console.error('Error fetching company info:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setSystemSettings(data);
                
                // Update form with fetched values
                const formData: any = {};
                Object.keys(data).forEach(key => {
                    formData[key] = data[key].value;
                });
                setSettingsForm({ ...settingsForm, ...formData });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleInitializeSettings = async () => {
        if (!confirm('Initialize default settings? This will not overwrite existing settings.')) return;

        try {
            const response = await fetch('/api/settings/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showMessage('success', 'Default settings initialized successfully');
                fetchSettings();
            } else {
                showMessage('error', 'Failed to initialize settings');
            }
        } catch (error) {
            showMessage('error', 'Error initializing settings');
        }
    };

    const handleSaveCompanyInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/settings/company', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(companyInfo)
            });

            if (response.ok) {
                showMessage('success', 'Company information saved successfully');
            } else {
                showMessage('error', 'Failed to save company information');
            }
        } catch (error) {
            showMessage('error', 'Error saving company information');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const settings = Object.keys(settingsForm).map(key => {
                const existing = systemSettings[key];
                return {
                    key,
                    value: settingsForm[key as keyof typeof settingsForm],
                    category: existing?.category || 'general',
                    description: existing?.description || ''
                };
            });

            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });

            if (response.ok) {
                showMessage('success', 'Settings saved successfully');
                fetchSettings();
            } else {
                showMessage('error', 'Failed to save settings');
            }
        } catch (error) {
            showMessage('error', 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Settings & Configuration</h1>
                <p className="text-gray-600 mt-1">Manage system settings and company information</p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'company'
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Building2 className="w-5 h-5" />
                        Company Info
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'inventory'
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Database className="w-5 h-5" />
                        Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'notifications'
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Bell className="w-5 h-5" />
                        Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'invoices'
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <FileText className="w-5 h-5" />
                        Invoices
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'general'
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Settings className="w-5 h-5" />
                        General
                    </button>
                </div>
            </div>

            {/* Company Info Tab */}
            {activeTab === 'company' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Company Information</h2>
                    <form onSubmit={handleSaveCompanyInfo}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.companyName}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={companyInfo.email}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={companyInfo.phone}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={companyInfo.website}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.address}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.city}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.state}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ZIP Code
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.zipCode}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, zipCode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.country}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tax ID
                                </label>
                                <input
                                    type="text"
                                    value={companyInfo.taxId}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency
                                </label>
                                <select
                                    value={companyInfo.currency}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, currency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="JPY">JPY - Japanese Yen</option>
                                    <option value="CAD">CAD - Canadian Dollar</option>
                                    <option value="AUD">AUD - Australian Dollar</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {saving ? 'Saving...' : 'Save Company Info'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Inventory Settings Tab */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Settings</h2>
                    <form onSubmit={handleSaveSettings}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Low Stock Threshold
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.low_stock_threshold}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, low_stock_threshold: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">Default threshold for low stock warnings</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Critical Stock Threshold
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.critical_stock_threshold}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, critical_stock_threshold: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">Threshold for critical stock alerts</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.auto_generate_alerts === 'true'}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, auto_generate_alerts: e.target.checked ? 'true' : 'false' })}
                                    className="w-5 h-5"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    Auto-generate low stock alerts
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>
                    <form onSubmit={handleSaveSettings}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.enable_email_notifications === 'true'}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, enable_email_notifications: e.target.checked ? 'true' : 'false' })}
                                    className="w-5 h-5"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    Enable email notifications
                                </label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.enable_low_stock_alerts === 'true'}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, enable_low_stock_alerts: e.target.checked ? 'true' : 'false' })}
                                    className="w-5 h-5"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    Enable low stock alerts
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Invoice Settings Tab */}
            {activeTab === 'invoices' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Settings</h2>
                    <form onSubmit={handleSaveSettings}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Invoice Number Prefix
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.invoice_prefix}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, invoice_prefix: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Number Prefix
                                </label>
                                <input
                                    type="text"
                                    value={settingsForm.payment_prefix}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, payment_prefix: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Tax Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settingsForm.default_tax_rate}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, default_tax_rate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Invoice Due Days
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.invoice_due_days}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, invoice_due_days: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* General Settings Tab */}
            {activeTab === 'general' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
                    <form onSubmit={handleSaveSettings}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Format
                                </label>
                                <select
                                    value={settingsForm.date_format}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, date_format: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Items Per Page
                                </label>
                                <input
                                    type="number"
                                    value={settingsForm.items_per_page}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, items_per_page: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timezone
                                </label>
                                <select
                                    value={settingsForm.timezone}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                                    <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                                    <option value="America/Denver">America/Denver (MST/MDT)</option>
                                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                                    <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                                    <option value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={handleInitializeSettings}
                                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                            >
                                Initialize Default Settings
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
