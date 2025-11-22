'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

enum UserRole {
    ADMIN = 'ADMIN',
    INVENTORY_MANAGER = 'INVENTORY_MANAGER',
    STAFF = 'STAFF'
}

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role: 'STAFF' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Store token in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="mt-2 text-text-secondary">Create your account to get started</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-border-light">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:border-transparent transition-all duration-200 hover:bg-hover-gray text-text-primary"
                                placeholder="Enter your full name"
                            />
                        </div>

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
                            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:border-transparent transition-all duration-200 hover:bg-hover-gray text-text-primary"
                                placeholder="Create a secure password"
                                minLength={6}
                            />
                            <p className="mt-1 text-xs text-text-muted">Must be at least 6 characters</p>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-hover-gray border border-border-light rounded-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-odoo-purple mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-medium text-text-primary mb-1">Warehouse Staff Account</h4>
                                    <p className="text-sm text-text-secondary">
                                        You're signing up as <strong>Warehouse Staff</strong>. Contact your administrator for Manager or Admin roles.
                                    </p>
                                </div>
                            </div>
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
                                Creating your account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <span className="text-text-secondary">Already have an account? </span>
                        <Link href="/login" className="font-medium text-odoo-purple hover:text-odoo-purple-soft transition-colors duration-200">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
