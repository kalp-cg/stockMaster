'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TrendingDown, Plus, Check } from 'lucide-react';

interface Delivery {
    id: string;
    deliveryNumber: string;
    status: string;
    createdAt: string;
    items: { product: { name: string }; quantity: number }[];
}

export default function DeliveriesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        locationId: '',
        items: [{ productId: '', quantity: 1 }],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [deliveriesData, productsData, locationsData] = await Promise.all([
                api.getDeliveries(),
                api.getProducts(),
                api.getLocations(),
            ]);
            setDeliveries(deliveriesData.deliveries || []);
            setProducts(productsData.products || []);
            setLocations(locationsData.locations || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createDelivery(formData);
            setShowModal(false);
            setFormData({ locationId: '', items: [{ productId: '', quantity: 1 }] });
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const addItem = () => {
        setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1 }] });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
                    <p className="text-gray-600">Manage outgoing stock deliveries</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="h-5 w-5" />Create Delivery
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Delivery #</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Items</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {deliveries.map((delivery) => (
                            <tr key={delivery.id} className="hover:bg-red-50 transition-colors">
                                <td className="px-6 py-4"><span className="text-sm font-mono font-semibold text-red-600">{delivery.deliveryNumber}</span></td>
                                <td className="px-6 py-4 text-sm text-gray-600">{delivery.items.length} items</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${delivery.status === 'VALIDATED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {delivery.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(delivery.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {deliveries.length === 0 && (
                    <div className="text-center py-16">
                        <TrendingDown className="mx-auto h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No deliveries yet</h3>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-white">Create Delivery</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                <select required value={formData.locationId} onChange={(e) => setFormData({ ...formData, locationId: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                                    <option value="">Select location</option>
                                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-gray-700">Items</label>
                                    <button type="button" onClick={addItem} className="text-sm text-red-600 font-medium">+ Add Item</button>
                                </div>
                                {formData.items.map((item, index) => (
                                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                        <select required value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg">
                                            <option value="">Select product</option>
                                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input type="number" required min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))} className="w-24 px-3 py-2 border rounded-lg" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium shadow-lg">Create Delivery</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
