'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { History } from 'lucide-react';

interface MoveHistory {
    id: string;
    moveType: string;
    quantityChanged: number;
    product: { name: string };
    location: { name: string };
    user: { name: string };
    createdAt: string;
}

export default function MoveHistoryPage() {
    const [history, setHistory] = useState<MoveHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await api.getMoveHistory();
            setHistory(data.moveHistory || []);
        } catch (error) {
            console.error('Failed to load move history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Move History</h1>
                <p className="text-gray-600">Track all inventory movements</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((move) => (
                            <tr key={move.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${move.moveType.includes('RECEIPT') ? 'bg-green-100 text-green-800' :
                                            move.moveType.includes('DELIVERY') ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                        }`}>
                                        {move.moveType.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{move.product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{move.location.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <span className={move.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {move.quantityChanged > 0 ? '+' : ''}{move.quantityChanged}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{move.user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(move.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && (
                    <div className="text-center py-12">
                        <History className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No history</h3>
                        <p className="mt-1 text-sm text-gray-500">No inventory movements yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
