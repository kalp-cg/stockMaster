'use client';

import { useState, useEffect } from 'react';
import { Plus, TruckIcon, CheckCircle, Clock, Search, AlertTriangle } from 'lucide-react';

interface Delivery {
  id: string;
  deliveryNumber: string;
  location: {
    id: string;
    name: string;
  };
  totalItems: number;
  isValidated: boolean;
  createdAt: string;
  items: {
    id: string;
    product: {
      name: string;
      sku: string;
    };
    quantityDelivered: number;
  }[];
}

interface Location {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface Stock {
  productId: string;
  locationId: string;
  quantity: number;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    locationId: '',
    notes: '',
    items: [{ productId: '', quantity: 0 }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deliveriesRes, locationsRes, productsRes] = await Promise.all([
        fetch('/api/deliveries'),
        fetch('/api/locations'),
        fetch('/api/products'),
      ]);

      const deliveriesData = await deliveriesRes.json();
      const locationsData = await locationsRes.json();
      const productsData = await productsRes.json();

      setDeliveries(deliveriesData.deliveries || []);
      setLocations(locationsData.locations || []);
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async (locationId: string) => {
    try {
      const response = await fetch(`/api/locations/${locationId}/stocks`);
      const data = await response.json();
      setStocks(data.stocks || []);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const handleLocationChange = (locationId: string) => {
    setNewDelivery({ ...newDelivery, locationId });
    if (locationId) {
      fetchStocks(locationId);
    }
  };

  const getAvailableStock = (productId: string) => {
    const stock = stocks.find(
      (s) => s.productId === productId && s.locationId === newDelivery.locationId
    );
    return stock?.quantity || 0;
  };

  const handleCreateDelivery = async () => {
    try {
      // Validate stock availability
      for (const item of newDelivery.items) {
        const available = getAvailableStock(item.productId);
        if (item.quantity > available) {
          alert(`Insufficient stock for selected product. Available: ${available}`);
          return;
        }
      }

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDelivery),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewDelivery({
          locationId: '',
          notes: '',
          items: [{ productId: '', quantity: 0 }],
        });
        setStocks([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
    }
  };

  const handleValidateDelivery = async (deliveryId: string) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/validate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error validating delivery:', error);
    }
  };

  const addItem = () => {
    setNewDelivery({
      ...newDelivery,
      items: [...newDelivery.items, { productId: '', quantity: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setNewDelivery({
      ...newDelivery,
      items: newDelivery.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newDelivery.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewDelivery({ ...newDelivery, items: updatedItems });
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.location.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'validated' && delivery.isValidated) ||
      (statusFilter === 'pending' && !delivery.isValidated);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Stock Deliveries</h1>
          <p className="text-gray-600">Manage outbound stock deliveries and shipments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
                <p className="text-3xl font-bold text-gray-900">{deliveries.length}</p>
              </div>
              <TruckIcon className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {deliveries.filter((d) => d.isValidated).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {deliveries.filter((d) => !d.isValidated).length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="validated">Completed</option>
                <option value="pending">Pending</option>
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                New Delivery
              </button>
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="glass rounded-2xl p-6 card-hover">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {delivery.deliveryNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From: <span className="font-semibold">{delivery.location.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(delivery.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  {delivery.isValidated ? (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  ) : (
                    <>
                      <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                      <button
                        onClick={() => handleValidateDelivery(delivery.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Items Delivered:</p>
                <div className="space-y-2">
                  {delivery.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          {item.quantityDelivered} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <TruckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No deliveries found</p>
          </div>
        )}
      </div>

      {/* Create Delivery Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Create New Delivery</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source Location
                </label>
                <select
                  value={newDelivery.locationId}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newDelivery.notes}
                  onChange={(e) => setNewDelivery({ ...newDelivery, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Items</label>
                  <button
                    onClick={addItem}
                    disabled={!newDelivery.locationId}
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold disabled:opacity-50"
                  >
                    + Add Item
                  </button>
                </div>

                {!newDelivery.locationId && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                      Please select a location first to see available stock
                    </p>
                  </div>
                )}

                {newDelivery.items.map((item, index) => {
                  const availableStock = getAvailableStock(item.productId);
                  return (
                    <div key={index} className="mb-3">
                      <div className="flex gap-3">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          disabled={!newDelivery.locationId}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          disabled={!newDelivery.locationId}
                          placeholder="Quantity"
                          max={availableStock}
                          className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        />

                        {newDelivery.items.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {item.productId && (
                        <p className="text-xs text-gray-500 mt-1 ml-1">
                          Available stock: <span className="font-semibold">{availableStock}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setStocks([]);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDelivery}
                disabled={!newDelivery.locationId}
                className="flex-1 gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                Create Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
