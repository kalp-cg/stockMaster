'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count?: {
    receipts: number;
    deliveries: number;
    transfers: number;
  };
}

export default function MyStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/my-staff', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">My Staff</h1>
          <p className="text-gray-600">Manage and monitor your team members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-green-600">{staff.length}</p>
              </div>
              <UserCheck className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Receipts</p>
                <p className="text-3xl font-bold text-purple-600">
                  {staff.reduce((sum, s) => sum + (s._count?.receipts || 0), 0)}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
                <p className="text-3xl font-bold text-orange-600">
                  {staff.reduce((sum, s) => sum + (s._count?.deliveries || 0), 0)}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="glass rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                    {member.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{member.email}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {member._count?.receipts || 0}
                    </p>
                    <p className="text-xs text-gray-500">Receipts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {member._count?.deliveries || 0}
                    </p>
                    <p className="text-xs text-gray-500">Deliveries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {member._count?.transfers || 0}
                    </p>
                    <p className="text-xs text-gray-500">Transfers</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {staff.length === 0
                ? 'No staff members assigned yet'
                : 'No staff members match your search'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
