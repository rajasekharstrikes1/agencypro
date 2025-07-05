import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Permission } from '../types';
import { 
  Shield, 
  Users, 
  Building2, 
  CreditCard, 
  BarChart2, 
  Settings,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SuperAdminDashboard: React.FC = () => {
  const { 
    userProfile, 
    currentTenant, 
    currentSubscription, 
    hasPermission,
    isRole,
    isSubscriptionActive,
    loading 
  } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Double check this is a super admin (should be redundant since this component is only shown to super admins)
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
        <Link 
          to="/admin/tenants" 
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Managed Tenants</h3>
              <p className="text-2xl font-semibold text-gray-900">24</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/admin/users" 
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">System Users</h3>
              <p className="text-2xl font-semibold text-gray-900">142</p>
            </div>
          </div>
        </Link>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Subscriptions</h3>
              <p className="text-2xl font-semibold text-gray-900">18</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Issues Today</h3>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/tenants/new"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-gray-600 mr-3" />
              <span>Create New Tenant</span>
            </div>
          </Link>

          <Link
            to="/admin/users/new"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-600 mr-3" />
              <span>Add System User</span>
            </div>
          </Link>

          <Link
            to="/admin/subscriptions"
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
              <span>Manage Subscriptions</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-start">
              <div className="p-2 rounded-full bg-gray-100 text-gray-600 mt-1">
                <Activity className="w-4 h-4" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">System</span> performed maintenance tasks
                </p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <span className="text-sm text-gray-600">Storage</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Degraded
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Subscription</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Super Admin (Unlimited)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Tenants</span>
              <span className="text-sm font-medium text-gray-900">18/∞</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Users</span>
              <span className="text-sm font-medium text-gray-900">142/∞</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;