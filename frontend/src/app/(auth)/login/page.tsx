'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Login attempt:', email);

        try {
            console.log('Calling api.login...');
            const data = await api.login(email, password);
            console.log('Login response:', data);
            login(data.token, data.user);
            console.log('Auth context updated, redirecting...');
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-light">
                <div className="flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-odoo-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-text-secondary">Redirecting...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-light px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-odoo-purple-soft to-odoo-purple rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-odoo-purple">
                        StockMaster
                    </h1>
                    <p className="mt-2 text-text-secondary">Sign in to your account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-border-light">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-status-error text-status-error px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:border-transparent transition-all duration-200 hover:bg-hover-gray text-text-primary"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-sm text-odoo-purple hover:text-odoo-purple-soft transition-colors duration-200">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:border-transparent transition-all duration-200 hover:bg-hover-gray text-text-primary"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-odoo-purple text-white py-3 px-4 rounded-lg font-medium hover:bg-odoo-purple-soft focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    {/* Signup Link */}
                    <div className="mt-6 text-center">
                        <span className="text-text-secondary">Don't have an account? </span>
                        <Link href="/signup" className="font-medium text-odoo-purple hover:text-odoo-purple-soft transition-colors duration-200">
                            Create one
                        </Link>
                    </div>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-border-light shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-odoo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-text-primary">Test Accounts:</p>
                    </div>
                    <div className="space-y-2">
                        <div className="bg-hover-gray p-3 rounded-lg border border-border-light">
                            <p className="text-xs font-medium text-text-primary mb-1">📊 Inventory Manager</p>
                            <div className="flex flex-col text-xs text-text-secondary space-y-0.5">
                                <span className="font-mono">📧 manager@stockmaster.com</span>
                                <span className="font-mono">🔑 Manager@123</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-text-muted mt-3 italic">Sign up to create a Staff account</p>
                </div>
            </div>
        </div>
    );
}
