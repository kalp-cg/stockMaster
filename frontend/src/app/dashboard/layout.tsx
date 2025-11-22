'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-light">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-odoo-purple"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-bg-light flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed on desktop, slide-in on mobile */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header - Fixed */}
                <header className="bg-white shadow-sm border-b border-border-light px-4 sm:px-6 py-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-hover-gray transition-colors"
                        >
                            <Menu className="h-6 w-6 text-text-secondary" />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-semibold text-text-primary truncate">
                                Welcome back, {user.name}
                            </h2>
                            <p className="text-xs sm:text-sm text-text-secondary">
                                Role: {user.role.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="p-4 sm:p-6">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
