import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, Invoice, Customer } from '../../types';
import { 
  Building, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Settings,
  Briefcase,
  Target,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalLeads: number;
  totalCustomers: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  pendingAmount: number;
  recentLeads: number;
  conversionRate: number;
}

const AgencyDashboard: React.FC = () => {
  const { currentUser, currentTenant, canAccessModule, userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    recentLeads: 0,
    conversionRate: 0
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid && currentTenant?.id) {
      fetchDashboardData();
    }
  }, [currentUser, currentTenant]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads if module is available
      let leads: Lead[] = [];
      if (canAccessModule('leads')) {
        const leadsQuery = query(
          collection(db, 'leads'),
          where('tenantId', '==', currentTenant!.id),
          orderBy('createdAt', 'desc')
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        leads = leadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lead[];
        setRecentLeads(leads.slice(0, 5));
      }

      // Fetch invoices and customers if module is available
      let invoices: Invoice[] = [];
      let customers: Customer[] = [];
      if (canAccessModule('invoices')) {
        const invoicesQuery = query(
          collection(db, `users/${currentUser!.uid}/invoices`),
          orderBy('createdAt', 'desc')
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        invoices = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        setRecentInvoices(invoices.slice(0, 5));

        const customersSnapshot = await getDocs(collection(db, `users/${currentUser!.uid}/customers`));
        customers = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
      }

      // Calculate stats
      const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length;
      const pendingAmount = invoices
        .filter(inv => inv.status === 'sent' || inv.status === 'draft')
        .reduce((sum, inv) => sum + inv.total, 0);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentLeadsCount = leads.filter(lead => 
        lead.createdAt.toDate() > thirtyDaysAgo
      ).length;

      const clientLeads = leads.filter(lead => lead.leadStatus === 'Client').length;
      const conversionRate = leads.length > 0 ? (clientLeads / leads.length) * 100 : 0;

      setStats({
        totalLeads: leads.length,
        totalCustomers: customers.length,
        totalInvoices: invoices.length,
        totalRevenue,
        pendingInvoices,
        pendingAmount,
        recentLeads: recentLeadsCount,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'Client':
        return 'bg-green-100 text-green-800';
      case 'Followup':
        return 'bg-yellow-100 text-yellow-800';
      case 'Created':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold mb-2">Agency Dashboard</h1>
            <p className="text-secondary opacity-90">Welcome to {currentTenant?.name}</p>
            <div className="flex items-center mt-4 space-x-4">
              <div className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                <span className="text-sm">{userProfile?.role.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                <span className="text-sm">All Systems Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <Link to="/settings" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <Settings className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {canAccessModule('leads') && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">+{stats.recentLeads} this month</span>
                  </div>
                </div>
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <Target className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-gray-600">Leads to clients</span>
                  </div>
                </div>
                <div className="bg-green-100 p-4 rounded-2xl">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </>
        )}

        {canAccessModule('invoices') && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-gray-600">{stats.totalInvoices} invoices</span>
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.pendingAmount.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">{stats.pendingInvoices} pending</span>
                  </div>
                </div>
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {canAccessModule('leads') && (
            <Link
              to="/leads"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Manage Leads</h3>
              <p className="text-sm text-gray-600">Track and convert your leads</p>
            </Link>
          )}

          {canAccessModule('invoices') && (
            <>
              <Link
                to="/invoices"
                className="group bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Invoice</h3>
                <p className="text-sm text-gray-600">Generate professional invoices</p>
              </Link>

              <Link
                to="/customers"
                className="group bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manage Customers</h3>
                <p className="text-sm text-gray-600">Organize customer database</p>
              </Link>
            </>
          )}

          <Link
            to="/settings"
            className="group bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Settings className="w-8 h-8 text-gray-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">Configure your agency</p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        {canAccessModule('leads') && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent Leads</h3>
                <Link to="/leads" className="text-sm text-accent hover:text-primary font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                          <p className="text-sm text-gray-600">{lead.emailAddress}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeadStatusColor(lead.leadStatus)}`}>
                          {lead.leadStatus}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {lead.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500">No recent leads</p>
                    <Link to="/leads" className="text-sm text-accent hover:text-primary font-medium mt-2 inline-block">
                      Create your first lead
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        {canAccessModule('invoices') && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent Invoices</h3>
                <Link to="/invoices" className="text-sm text-accent hover:text-primary font-medium">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₹{invoice.total.toLocaleString()}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500">No recent invoices</p>
                    <Link to="/invoices" className="text-sm text-accent hover:text-primary font-medium mt-2 inline-block">
                      Create your first invoice
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboard;