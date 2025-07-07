import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { DiscountCode, SubscriptionPlan, Permission } from '../types';
import { Plus, Edit, Trash2, Tag, Shield, Save, X, Copy } from 'lucide-react';

const AdminDiscountCodesPage: React.FC = () => {
  const { hasPermission, userProfile } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<Partial<DiscountCode>>({
    code: '',
    type: 'percentage',
    value: 0,
    maxUses: undefined,
    usedCount: 0,
    validFrom: new Date() as any,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
    applicablePlans: [],
    isActive: true
  });

  useEffect(() => {
    if (hasPermission(Permission.MANAGE_DISCOUNT_CODES)) {
      fetchDiscounts();
    }
  }, [hasPermission]);

  const fetchDiscounts = async () => {
    try {
      const discountsSnapshot = await getDocs(collection(db, 'discount_codes'));
      const discountsList = discountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom.toDate(),
        validUntil: doc.data().validUntil.toDate()
      })) as DiscountCode[];
      setDiscounts(discountsList);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const discountData = {
        ...formData,
        createdBy: userProfile?.uid,
        updatedAt: new Date()
      };

      if (editingDiscount?.id) {
        await updateDoc(doc(db, 'discount_codes', editingDiscount.id), discountData);
      } else {
        await addDoc(collection(db, 'discount_codes'), {
          ...discountData,
          createdAt: new Date()
        });
      }
      
      await fetchDiscounts();
      handleCancel();
    } catch (error) {
      console.error('Error saving discount code:', error);
    }
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      ...discount,
      validFrom: discount.validFrom,
      validUntil: discount.validUntil
    });
    setShowForm(true);
  };

  const handleDelete = async (discountId: string) => {
    if (window.confirm('Are you sure you want to delete this discount code?')) {
      try {
        await deleteDoc(doc(db, 'discount_codes', discountId));
        setDiscounts(discounts.filter(discount => discount.id !== discountId));
      } catch (error) {
        console.error('Error deleting discount code:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDiscount(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      maxUses: undefined,
      usedCount: 0,
      validFrom: new Date() as any,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) as any,
      applicablePlans: [],
      isActive: true
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const handlePlanChange = (plan: SubscriptionPlan, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      applicablePlans: checked
        ? [...(prev.applicablePlans || []), plan]
        : (prev.applicablePlans || []).filter(p => p !== plan)
    }));
  };

  if (!hasPermission(Permission.MANAGE_DISCOUNT_CODES)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage discount codes.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
          <p className="text-gray-600">Create and manage discount codes for subscriptions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Discount Code
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Code *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    placeholder="Enter discount code"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.type === 'percentage' ? 100 : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder={formData.type === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in INR'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Uses (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From *
                </label>
                <input
                  type="date"
                  required
                  value={formData.validFrom instanceof Date ? formData.validFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, validFrom: new Date(e.target.value) as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until *
                </label>
                <input
                  type="date"
                  required
                  value={formData.validUntil instanceof Date ? formData.validUntil.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, validUntil: new Date(e.target.value) as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Plans
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(SubscriptionPlan).map((plan) => (
                  <div key={plan} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`plan-${plan}`}
                      checked={formData.applicablePlans?.includes(plan) || false}
                      onChange={(e) => handlePlanChange(plan, e.target.checked)}
                      className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                    />
                    <label htmlFor={`plan-${plan}`} className="ml-2 block text-sm text-gray-900 capitalize">
                      {plan}
                    </label>
                  </div>
                ))}
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
                Active
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
                {editingDiscount ? 'Update' : 'Create'} Discount Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discount Codes List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-primary p-2 rounded-lg">
                        <Tag className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 font-mono">{discount.code}</span>
                          <button
                            onClick={() => copyToClipboard(discount.code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          Plans: {discount.applicablePlans.join(', ') || 'All'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discount.usedCount} / {discount.maxUses || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{discount.validFrom.toLocaleDateString()}</div>
                    <div>to {discount.validUntil.toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      discount.isActive && new Date() <= discount.validUntil
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive && new Date() <= discount.validUntil ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="text-accent hover:text-primary transition-colors"
                        title="Edit discount code"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id!)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete discount code"
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
        
        {discounts.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No discount codes</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first discount code.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Discount Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDiscountCodesPage;