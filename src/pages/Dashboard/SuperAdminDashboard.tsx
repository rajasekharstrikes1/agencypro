import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Settings,
  Plus,
  Eye,
  Filter,
  Search,
  BarChart3,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalAgencies: number;
  activeAgencies: number;
  totalSubscriptions: number;
  totalRevenue: number;
  freeUsers: number;
  paidUsers: number;
  monthlyGrowth: number;
  recentSignups: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAgencies: 0,
    activeAgencies: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    freeUsers: 0,
    paidUsers: 0,
    monthlyGrowth: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenants
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenants = tenantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch subscriptions
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptions = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate stats
      const activeAgencies = tenants.filter(t => t.isActive).length;
      const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);
      const freeUsers = subscriptions.filter(sub => sub.plan === 'trial').length;
      const paidUsers = subscriptions.filter(sub => sub.plan !== 'trial' && sub.status === 'active').length;
      
      // Recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSignups = tenants.filter(t => 
        t.createdAt && t.createdAt.toDate() > thirtyDaysAgo
      ).length;

      setStats({
        totalAgencies: tenants.length,
        activeAgencies,
        totalSubscriptions: subscriptions.length,
        totalRevenue,
        freeUsers,
        paidUsers,
        monthlyGrowth: 12.5, // Mock data
        recentSignups
      });

      // Mock recent activities
      setRecentActivities([
        { id: 1, type: 'signup', message: 'New agency "Digital Marketing Pro" registered', time: '2 hours ago', icon: Building2, color: 'text-blue-600' },
        { id: 2, type: 'subscription', message: 'Agency "Creative Solutions" upgraded to Premium', time: '4 hours ago', icon: CreditCard, color: 'text-green-600' },
        { id: 3, type: 'payment', message: 'Payment of ₹4,999 received from "Tech Innovators"', time: '6 hours ago', icon: DollarSign, color: 'text-purple-600' },
        { id: 4, type: 'user', message: 'New user added to "Marketing Hub"', time: '8 hours ago', icon: Users, color: 'text-orange-600' },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-gray-800 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
            <p className="text-secondary opacity-90">Welcome back, {userProfile?.name}</p>
            <div className="flex items-center mt-4 space-x-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-sm">System Administrator</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                <span className="text-sm">All Systems Operational</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Agencies</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAgencies}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{stats.recentSignups} this month</span>
              </div>
            </div>
            <div className="bg-blue-100 p-4 rounded-2xl">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubscriptions}</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600">{stats.activeAgencies} active</span>
              </div>
            </div>
            <div className="bg-green-100 p-4 rounded-2xl">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{stats.monthlyGrowth}% growth</span>
              </div>
            </div>
            <div className="bg-purple-100 p-4 rounded-2xl">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">User Distribution</p>
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-lg font-bold text-orange-600">{stats.freeUsers}</p>
                  <p className="text-xs text-gray-500">Free</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.paidUsers}</p>
                  <p className="text-xs text-gray-500">Paid</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-100 p-4 rounded-2xl">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/tenants"
            className="group bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Agencies</h3>
            <p className="text-sm text-gray-600">View and manage all registered agencies</p>
          </Link>

          <Link
            to="/admin/subscription-plans"
            className="group bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Subscription Plans</h3>
            <p className="text-sm text-gray-600">Create and manage subscription plans</p>
          </Link>

          <Link
            to="/admin/payment-gateway"
            className="group bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Payment Gateway</h3>
            <p className="text-sm text-gray-600">Configure Razorpay and payment settings</p>
          </Link>

          <Link
            to="/admin/discount-codes"
            className="group bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-orange-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-5 h-5 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Discount Codes</h3>
            <p className="text-sm text-gray-600">Manage promotional discount codes</p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activities</h3>
            <button className="text-sm text-accent hover:text-primary font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-lg bg-white shadow-sm ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium text-gray-900">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium text-gray-900">Authentication</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="font-medium text-gray-900">Payment Gateway</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Monitoring</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span className="font-medium text-gray-900">Storage</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;