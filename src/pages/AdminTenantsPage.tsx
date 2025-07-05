import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Tenant, Permission } from '../types';
import { Plus, Edit, Trash2, Building2, Shield, Users } from 'lucide-react';

const AdminTenantsPage: React.FC = () => {
  const { userProfile, hasPermission } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    isActive: true,
    allowedModules: ['leads', 'invoices'] as ('leads' | 'invoices')[],
    maxUsers: 10
  });

  useEffect(() => {
    if (hasPermission(Permission.MANAGE_TENANTS)) {
      fetchTenants();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tenantData = {
        ...formData,
        settings: {
          allowedModules: formData.allowedModules,
          maxUsers: formData.maxUsers
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
      maxUsers: tenant.settings?.maxUsers || 10
    });
    setShowForm(true);
  };

  const handleDelete = async (tenantId: string) => {
    if (window.confirm('Are you sure you want to delete this tenant? This will affect all associated users and data.')) {
      try {
        await deleteDoc(doc(db, 'tenants', tenantId));
        setTenants(tenants.filter(tenant => tenant.id !== tenantId));
      } catch (error) {
        console.error('Error deleting tenant:', error);
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
      maxUsers: 10
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

  if (!hasPermission(Permission.MANAGE_TENANTS)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage tenants.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600">Manage client tenants and their configurations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant Name *
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
                {editingTenant ? 'Update' : 'Create'} Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-primary p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{tenant.name}</h3>
                  {tenant.domain && (
                    <p className="text-sm text-gray-500">{tenant.domain}</p>
                  )}
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                tenant.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                Max Users: {tenant.settings?.maxUsers || 'Unlimited'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Modules:</strong> {tenant.settings?.allowedModules?.join(', ') || 'All'}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(tenant)}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(tenant.id!)}
                className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first client tenant.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTenantsPage;