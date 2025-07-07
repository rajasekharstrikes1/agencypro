import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PaymentGatewayConfig, Permission } from '../types';
import { Plus, Edit, Trash2, CreditCard, Shield, Save, X, Eye, EyeOff } from 'lucide-react';

const AdminPaymentGatewayPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [configs, setConfigs] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PaymentGatewayConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<PaymentGatewayConfig>>({
    provider: 'razorpay',
    isActive: true,
    testMode: true,
    config: {
      keyId: '',
      keySecret: '',
      webhookSecret: ''
    }
  });

  useEffect(() => {
    if (hasPermission(Permission.MANAGE_PAYMENT_GATEWAY)) {
      fetchConfigs();
    }
  }, [hasPermission]);

  const fetchConfigs = async () => {
    try {
      const configsSnapshot = await getDocs(collection(db, 'payment_config'));
      const configsList = configsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentGatewayConfig[];
      setConfigs(configsList);
    } catch (error) {
      console.error('Error fetching payment configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingConfig?.id) {
        await updateDoc(doc(db, 'payment_config', editingConfig.id), configData);
      } else {
        await addDoc(collection(db, 'payment_config'), {
          ...configData,
          createdAt: new Date()
        });
      }
      
      await fetchConfigs();
      handleCancel();
    } catch (error) {
      console.error('Error saving payment config:', error);
    }
  };

  const handleEdit = (config: PaymentGatewayConfig) => {
    setEditingConfig(config);
    setFormData(config);
    setShowForm(true);
  };

  const handleDelete = async (configId: string) => {
    if (window.confirm('Are you sure you want to delete this payment configuration?')) {
      try {
        await deleteDoc(doc(db, 'payment_config', configId));
        setConfigs(configs.filter(config => config.id !== configId));
      } catch (error) {
        console.error('Error deleting payment config:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConfig(null);
    setFormData({
      provider: 'razorpay',
      isActive: true,
      testMode: true,
      config: {
        keyId: '',
        keySecret: '',
        webhookSecret: ''
      }
    });
  };

  const toggleSecretVisibility = (configId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  if (!hasPermission(Permission.MANAGE_PAYMENT_GATEWAY)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage payment gateway settings.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateway Configuration</h1>
          <p className="text-gray-600">Configure payment gateways for subscription processing</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Configuration
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingConfig ? 'Edit Configuration' : 'Add Payment Gateway Configuration'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider *
                </label>
                <select
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'razorpay' | 'stripe' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
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
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="testMode"
                    checked={formData.testMode}
                    onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="testMode" className="ml-2 block text-sm text-gray-900">
                    Test Mode
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key ID *
              </label>
              <input
                type="text"
                required
                value={formData.config?.keyId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config!, keyId: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="Enter Key ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Secret *
              </label>
              <input
                type="password"
                required
                value={formData.config?.keySecret}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config!, keySecret: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="Enter Key Secret"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret
              </label>
              <input
                type="password"
                value={formData.config?.webhookSecret}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config!, webhookSecret: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="Enter Webhook Secret (optional)"
              />
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingConfig ? 'Update' : 'Create'} Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations List */}
      <div className="grid grid-cols-1 gap-6">
        {configs.map((config) => (
          <div key={config.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-primary p-2 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">{config.provider}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      config.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      config.testMode
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {config.testMode ? 'Test Mode' : 'Live Mode'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(config)}
                  className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(config.id!)}
                  className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Key ID:</span>
                <span className="text-sm text-gray-900 font-mono">{config.config.keyId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Key Secret:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900 font-mono">
                    {showSecrets[config.id!] ? config.config.keySecret : '••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => toggleSecretVisibility(config.id!)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets[config.id!] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {config.config.webhookSecret && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Webhook Secret:</span>
                  <span className="text-sm text-gray-900 font-mono">••••••••••••••••</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment configurations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first payment gateway configuration.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentGatewayPage;