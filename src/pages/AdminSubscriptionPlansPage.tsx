import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionPlan, Permission } from '../types';
import { Plus, Edit, Trash2, CreditCard, Shield, Save, X } from 'lucide-react';

interface PlanData {
  id?: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  maxUsers: number;
  maxLeads: number;
  maxInvoices: number;
  trialDays: number;
  isActive: boolean;
  discount?: {
    percentage: number;
    validUntil: Date;
    description: string;
  };
}

const AdminSubscriptionPlansPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);
  const [formData, setFormData] = useState<PlanData>({
    name: '',
    price: 0,
    currency: 'INR',
    features: [''],
    maxUsers: 5,
    maxLeads: 1000,
    maxInvoices: 500,
    trialDays: 0,
    isActive: true
  });

  useEffect(() => {
    if (hasPermission(Permission.MANAGE_SUBSCRIPTIONS)) {
      fetchPlans();
    }
  }, [hasPermission]);

  const fetchPlans = async () => {
    try {
      const plansSnapshot = await getDocs(collection(db, 'subscription_plans'));
      const plansList = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanData[];
      setPlans(plansList);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        updatedAt: new Date()
      };

      if (editingPlan?.id) {
        await updateDoc(doc(db, 'subscription_plans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'subscription_plans'), {
          ...planData,
          createdAt: new Date()
        });
      }
      
      await fetchPlans();
      handleCancel();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleEdit = (plan: PlanData) => {
    setEditingPlan(plan);
    setFormData(plan);
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'subscription_plans', planId));
        setPlans(plans.filter(plan => plan.id !== planId));
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 0,
      currency: 'INR',
      features: [''],
      maxUsers: 5,
      maxLeads: 1000,
      maxInvoices: 500,
      trialDays: 0,
      isActive: true
    });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (!hasPermission(Permission.MANAGE_SUBSCRIPTIONS)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage subscription plans.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600">Manage subscription plans and pricing</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingPlan ? 'Edit Plan' : 'Add New Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="e.g., Basic Plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
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
                  value={formData.maxUsers === -1 ? '' : formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value === '' ? -1 : Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Leads
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxLeads === -1 ? '' : formData.maxLeads}
                  onChange={(e) => setFormData({ ...formData, maxLeads: e.target.value === '' ? -1 : Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Invoices
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxInvoices === -1 ? '' : formData.maxInvoices}
                  onChange={(e) => setFormData({ ...formData, maxInvoices: e.target.value === '' ? -1 : Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trial Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.trialDays}
                  onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      placeholder="Enter feature"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm text-accent hover:text-primary"
                >
                  + Add Feature
                </button>
              </div>
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
                Active Plan
              </label>
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
                {editingPlan ? 'Update' : 'Create'} Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-primary p-2 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="text-2xl font-bold text-primary">₹{plan.price.toLocaleString()}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                plan.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max Users:</span>
                <span className="font-medium">{plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max Leads:</span>
                <span className="font-medium">{plan.maxLeads === -1 ? 'Unlimited' : plan.maxLeads.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max Invoices:</span>
                <span className="font-medium">{plan.maxInvoices === -1 ? 'Unlimited' : plan.maxInvoices.toLocaleString()}</span>
              </div>
              {plan.trialDays > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trial Days:</span>
                  <span className="font-medium">{plan.trialDays}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(plan)}
                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(plan.id!)}
                className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subscription plans</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first subscription plan.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionPlansPage;