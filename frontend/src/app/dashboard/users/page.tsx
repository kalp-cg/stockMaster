'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users as UsersIcon, Shield } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600">Manage system users and permissions</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Admin Only</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-purple-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                            user.role === 'INVENTORY_MANAGER' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
