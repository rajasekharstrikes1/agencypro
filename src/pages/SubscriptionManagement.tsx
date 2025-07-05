import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  Subscription, 
  SubscriptionPlan, 
  SubscriptionStatus, 
  SUBSCRIPTION_PLANS,
  Permission 
} from '../types';
import { CreditCard, Check, X, Calendar, DollarSign } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SubscriptionManagement: React.FC = () => {
  const { userProfile, currentTenant, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    fetchCurrentSubscription();
    loadRazorpayScript();
  }, [currentTenant]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchCurrentSubscription = async () => {
    if (!currentTenant?.subscriptionId) return;
    
    try {
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscription = subscriptionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find(sub => sub.tenantId === currentTenant.id) as Subscription;
      
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const createRazorpayOrder = async (plan: SubscriptionPlan) => {
    const planDetails = SUBSCRIPTION_PLANS[plan];
    
    try {
      // In a real implementation, you would call your backend to create a Razorpay order
      // For now, we'll simulate the order creation
      const order = {
        id: `order_${Date.now()}`,
        amount: planDetails.price * 100, // Razorpay expects amount in paise
        currency: planDetails.currency
      };
      
      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!currentTenant || !userProfile) return;
    
    setLoading(true);
    try {
      const planDetails = SUBSCRIPTION_PLANS[plan];
      
      if (plan === SubscriptionPlan.TRIAL) {
        // Create trial subscription directly
        await createSubscription(plan, 0, null, null);
      } else {
        // Create Razorpay order and open payment modal
        const order = await createRazorpayOrder(plan);
        
        const options = {
          key: process.env.VITE_RAZORPAY_KEY_ID, // You'll need to add this to your .env
          amount: order.amount,
          currency: order.currency,
          name: 'Agency Pro',
          description: `${planDetails.name} Subscription`,
          order_id: order.id,
          handler: async (response: any) => {
            await createSubscription(
              plan, 
              planDetails.price, 
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
          },
          prefill: {
            name: userProfile.name,
            email: userProfile.email,
            contact: currentTenant.contactInfo.phone
          },
          theme: {
            color: '#0e2625'
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
      alert('Error processing subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (
    plan: SubscriptionPlan, 
    amount: number,
    paymentId: string | null,
    orderId: string | null
  ) => {
    if (!currentTenant) return;
    
    try {
      const now = new Date();
      const endDate = new Date();
      
      if (plan === SubscriptionPlan.TRIAL) {
        endDate.setDate(now.getDate() + SUBSCRIPTION_PLANS[plan].trialDays);
      } else {
        endDate.setMonth(now.getMonth() + 1); // Monthly subscription
      }
      
      const subscriptionData: Omit<Subscription, 'id'> = {
        tenantId: currentTenant.id!,
        plan,
        status: plan === SubscriptionPlan.TRIAL ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        startDate: now as any,
        endDate: endDate as any,
        trialEndDate: plan === SubscriptionPlan.TRIAL ? endDate as any : undefined,
        amount,
        currency: 'INR',
        autoRenew: true,
        createdAt: now as any,
        updatedAt: now as any
      };
      
      if (paymentId && orderId) {
        subscriptionData.razorpaySubscriptionId = paymentId;
      }
      
      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
      
      // Update tenant with subscription ID
      await updateDoc(doc(db, 'tenants', currentTenant.id!), {
        subscriptionId: docRef.id,
        updatedAt: now
      });
      
      // Record payment if it's a paid plan
      if (paymentId && orderId) {
        await addDoc(collection(db, 'payments'), {
          tenantId: currentTenant.id!,
          subscriptionId: docRef.id,
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          amount,
          currency: 'INR',
          status: 'completed',
          paymentDate: now,
          createdAt: now
        });
      }
      
      alert('Subscription activated successfully!');
      await fetchCurrentSubscription();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  if (!hasPermission(Permission.MANAGE_TENANT_SETTINGS)) {
    return (
      <div className="text-center py-12">
        <X className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage subscriptions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Choose the perfect plan for your agency</p>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {SUBSCRIPTION_PLANS[currentSubscription.plan].name}
              </p>
              <p className="text-sm text-gray-500">
                Status: {currentSubscription.status.toUpperCase()}
              </p>
              <p className="text-sm text-gray-500">
                Expires: {currentSubscription.endDate.toDate().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                ₹{currentSubscription.amount.toLocaleString()}/month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
              currentSubscription?.plan === plan.id
                ? 'border-primary'
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                {plan.price > 0 && <span className="text-gray-500">/month</span>}
              </div>
              {plan.trialDays > 0 && (
                <p className="text-sm text-green-600 mt-2">{plan.trialDays} days free trial</p>
              )}
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {currentSubscription?.plan === plan.id ? (
                <button
                  disabled
                  className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                  className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : plan.price === 0 ? 'Start Trial' : 'Subscribe'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Max Users
                </td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Max Leads
                </td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {plan.maxLeads === -1 ? 'Unlimited' : plan.maxLeads.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Max Invoices
                </td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {plan.maxInvoices === -1 ? 'Unlimited' : plan.maxInvoices.toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;