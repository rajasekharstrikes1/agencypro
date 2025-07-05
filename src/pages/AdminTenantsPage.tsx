import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Tenant, Permission, Subscription, SubscriptionStatus } from '../types';
import { Plus, Edit, Trash2, Building2, Shield, Users, Search, ToggleLeft, ToggleRight, Pause } from 'lucide-react';

const AdminTenantsPage: React.FC = () => {
  const { userProfile, hasPermission } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    isActive: true,
    allowedModules: ['leads', 'invoices'] as ('leads' | 'invoices')[],
    maxUsers: 10,
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  useEffect(() => {
    if (hasPermission(Permission.MANAGE_ALL_TENANTS)) {
      fetchTenants();
      fetchSubscriptions();
    }
  }, [hasPermission]);

  const fetchTenants = async () => {
    try {
      const tenantsRef = collection(db, 'tenants');
      const querySnapshot = await getDocs(tenantsRef);
      const tenantsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];
      setTenants(tenantsList);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const subscriptionsRef = collection(db, 'subscriptions');
      const querySnapshot = await getDocs(subscriptionsRef);
      const subscriptionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];
      setSubscriptions(subscriptionsList);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tenantData = {
        ...formData,
        settings: {
          allowedModules: formData.allowedModules,
          maxUsers: formData.maxUsers
        },
        contactInfo: {
          email: formData.contactEmail,
          phone: formData.contactPhone,
          address: formData.address
        },
        createdBy: userProfile?.uid,
        updatedAt: new Date()
      };

      if (editingTenant) {
        await updateDoc(doc(db, 'tenants', editingTenant.id!), tenantData);
      } else {
        await addDoc(collection(db, 'tenants'), {
          ...tenantData,
          createdAt: new Date()
        });
      }
      
      await fetchTenants();
      handleCancel();
    } catch (error) {
      console.error('Error saving tenant:', error);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain || '',
      isActive: tenant.isActive,
      allowedModules: tenant.settings?.allowedModules || ['leads', 'invoices'],
      maxUsers: tenant.settings?.maxUsers || 10,
      contactEmail: tenant.contactInfo?.email || '',
      contactPhone: tenant.contactInfo?.phone || '',
      address: tenant.contactInfo?.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (tenantId: string) => {
    if (window.confirm('Are you sure you want to delete this agency? This will affect all associated users and data.')) {
      try {
        await deleteDoc(doc(db, 'tenants', tenantId));
        setTenants(tenants.filter(tenant => tenant.id !== tenantId));
      } catch (error) {
        console.error('Error deleting tenant:', error);
      }
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      await updateDoc(doc(db, 'tenants', tenant.id!), {
        isActive: !tenant.isActive,
        updatedAt: new Date()
      });
      setTenants(tenants.map(t => 
        t.id === tenant.id ? { ...t, isActive: !t.isActive } : t
      ));
    } catch (error) {
      console.error('Error updating tenant status:', error);
    }
  };

  const handleSuspendTenant = async (tenant: Tenant) => {
    if (window.confirm('Are you sure you want to suspend this agency? They will lose access immediately.')) {
      try {
        // Update tenant status
        await updateDoc(doc(db, 'tenants', tenant.id!), {
          isActive: false,
          suspendedAt: new Date(),
          updatedAt: new Date()
        });

        // Update subscription status if exists
        const tenantSubscription = subscriptions.find(s => s.tenantId === tenant.id);
        if (tenantSubscription) {
          await updateDoc(doc(db, 'subscriptions', tenantSubscription.id!), {
            status: SubscriptionStatus.SUSPENDED,
            updatedAt: new Date()
          });
        }

        await fetchTenants();
        await fetchSubscriptions();
      } catch (error) {
        console.error('Error suspending tenant:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTenant(null);
    setFormData({
      name: '',
      domain: '',
      isActive: true,
      allowedModules: ['leads', 'invoices'],
      maxUsers: 10,
      contactEmail: '',
      contactPhone: '',
      address: ''
    });
  };

  const handleModuleChange = (module: 'leads' | 'invoices', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowedModules: checked
        ? [...prev.allowedModules, module]
        : prev.allowedModules.filter(m => m !== module)
    }));
  };

  const getSubscriptionStatus = (tenantId: string) => {
    const subscription = subscriptions.find(s => s.tenantId === tenantId);
    return subscription?.status || 'none';
  };

  const getSubscriptionPlan = (tenantId: string) => {
    const subscription = subscriptions.find(s => s.tenantId === tenantId);
    return subscription?.plan || 'none';
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = searchTerm === '' ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && tenant.isActive) ||
      (filterStatus === 'inactive' && !tenant.isActive) ||
      (filterStatus === 'suspended' && getSubscriptionStatus(tenant.id!) === SubscriptionStatus.SUSPENDED);

    return matchesSearch && matchesStatus;
  });

  if (!hasPermission(Permission.MANAGE_ALL_TENANTS)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage agencies.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Management</h1>
          <p className="text-gray-600">Manage client agencies and their configurations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agency
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Agencies
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="all">All Agencies</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingTenant ? 'Edit Agency' : 'Add New Agency'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="e.g., BigC, LOT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain (Optional)
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="e.g., bigc.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Users
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Modules
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="leads"
                    checked={formData.allowedModules.includes('leads')}
                    onChange={(e) => handleModuleChange('leads', e.target.checked)}
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="leads" className="ml-2 block text-sm text-gray-900">
                    Leads Management
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="invoices"
                    checked={formData.allowedModules.includes('invoices')}
                    onChange={(e) => handleModuleChange('invoices', e.target.checked)}
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="invoices" className="ml-2 block text-sm text-gray-900">
                    Invoice Management
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
              >
                {editingTenant ? 'Update' : 'Create'} Agency
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agencies Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.domain || 'No domain'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tenant.contactInfo?.email}</div>
                    <div className="text-sm text-gray-500">{tenant.contactInfo?.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{getSubscriptionPlan(tenant.id!)}</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getSubscriptionStatus(tenant.id!) === SubscriptionStatus.ACTIVE
                        ? 'bg-green-100 text-green-800'
                        : getSubscriptionStatus(tenant.id!) === SubscriptionStatus.TRIAL
                        ? 'bg-blue-100 text-blue-800'
                        : getSubscriptionStatus(tenant.id!) === SubscriptionStatus.SUSPENDED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getSubscriptionStatus(tenant.id!)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(tenant)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                        tenant.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {tenant.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.createdAt.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="text-accent hover:text-primary transition-colors"
                        title="Edit agency"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSuspendTenant(tenant)}
                        className="text-yellow-600 hover:text-yellow-900 transition-colors"
                        title="Suspend agency"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id!)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete agency"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agencies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Get started by adding your first client agency.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTenantsPage;