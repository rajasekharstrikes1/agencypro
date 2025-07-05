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
  CheckCircle
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
  const { currentUser, currentTenant, canAccessModule } = useAuth();
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
      <div className="bg-white shadow-sm border-b rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agency Dashboard</h1>
            <p className="text-gray-600">Welcome to {currentTenant?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/settings" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {canAccessModule('leads') && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLeads}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">+{stats.recentLeads}</span>
                <span className="text-sm text-gray-500 ml-2">this month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-500">Leads to clients</span>
              </div>
            </div>
          </>
        )}

        {canAccessModule('invoices') && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">{stats.totalInvoices} invoices</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.pendingAmount.toLocaleString()}</p>
                </div>
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-orange-600">{stats.pendingInvoices} pending</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        {canAccessModule('leads') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
                <Link to="/leads" className="text-sm text-accent hover:text-primary">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                  <p className="text-sm text-gray-500 text-center py-4">No recent leads</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        {canAccessModule('invoices') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                <Link to="/invoices" className="text-sm text-accent hover:text-primary">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                  <p className="text-sm text-gray-500 text-center py-4">No recent invoices</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {canAccessModule('leads') && (
                <Link
                  to="/leads"
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Briefcase className="h-5 w-5 mr-2" />
                  Manage Leads
                </Link>
              )}
              {canAccessModule('invoices') && (
                <>
                  <Link
                    to="/invoices"
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Create Invoice
                  </Link>
                  <Link
                    to="/customers"
                    className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Manage Customers
                  </Link>
                </>
              )}
              <Link
                to="/settings"
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;