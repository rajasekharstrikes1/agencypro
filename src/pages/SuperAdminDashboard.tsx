import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserRole, Permission, Tenant, Subscription, SubscriptionStatus } from '../types';
import { 
  Shield, 
  Users, 
  Building2, 
  CreditCard, 
  BarChart2, 
  Settings,
  AlertCircle,
  Activity,
  TrendingUp,
  DollarSign,
  Tag,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { 
    userProfile, 
    hasPermission,
    isRole,
    loading 
  } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isRole(UserRole.SUPER_ADMIN)) {
      fetchDashboardData();
    }
  }, [isRole]);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch tenants
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenants = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];

      // Fetch subscriptions
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscription[];

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats
      const activeTenants = tenants.filter(t => t.isActive).length;
      const trialTenants = subscriptions.filter(s => s.status === SubscriptionStatus.TRIAL).length;
      const activeSubscriptions = subscriptions.filter(s => 
        s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL
      ).length;
      const totalRevenue = subscriptions
        .filter(s => s.status === SubscriptionStatus.ACTIVE)
        .reduce((sum, s) => sum + s.amount, 0);

      setStats({
        totalTenants: tenants.length,
        activeTenants,
        trialTenants,
        totalUsers: users.length,
        totalRevenue,
        activeSubscriptions
      });

      // Get recent tenants
      const recentTenantsData = tenants
        .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
        .slice(0, 5);
      setRecentTenants(recentTenantsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isRole(UserRole.SUPER_ADMIN)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have super admin privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <Shield className="w-4 h-4 mr-1" />
              SUPER ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/tenants" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Agencies</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '...' : stats.totalTenants}
              </p>
              <p className="text-sm text-gray-600">
                {loadingStats ? '...' : stats.activeTenants} active
              </p>
            </div>
          </div>
        </Link>

        <Link to="/admin/users" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '...' : stats.totalUsers}
              </p>
              <p className="text-sm text-gray-600">Across all agencies</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/subscription-plans" className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '...' : stats.activeSubscriptions}
              </p>
              <p className="text-sm text-gray-600">
                {loadingStats ? '...' : stats.trialTenants} on trial
              </p>
            </div>
          </div>
        </Link>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}
              </p>
              <p className="text-sm text-gray-600">From paid plans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/tenants"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-gray-600 mr-3" />
              <span>Manage Agencies</span>
            </div>
          </Link>

          <Link
            to="/admin/users"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-600 mr-3" />
              <span>Manage Users</span>
            </div>
          </Link>

          <Link
            to="/admin/subscription-plans"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
              <span>Subscription Plans</span>
            </div>
          </Link>

          <Link
            to="/admin/payment-gateway"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
              <span>Payment Gateway</span>
            </div>
          </Link>

          <Link
            to="/admin/discount-codes"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Tag className="w-5 h-5 text-gray-600 mr-3" />
              <span>Discount Codes</span>
            </div>
          </Link>

          <Link
            to="/register"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Plus className="w-5 h-5 text-gray-600 mr-3" />
              <span>Add User</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Agencies */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Agency Registrations</h2>
          <div className="space-y-4">
            {recentTenants.length > 0 ? (
              recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mt-1">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-800">{tenant.name}</p>
                    <p className="text-xs text-gray-500">
                      {tenant.contactInfo.email} • {tenant.createdAt.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent registrations</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Health</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Authentication</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Gateway</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Service</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Monitoring
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;