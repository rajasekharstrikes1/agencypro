import React from 'react';
import { User, FileText, DollarSign, Calendar, Download, Eye, Clock, CheckCircle } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const clientStats = [
    { title: 'Total Invoices', value: '24', icon: FileText, change: '+3', color: 'bg-blue-500' },
    { title: 'Amount Paid', value: '$18,450', icon: DollarSign, change: '+$2,100', color: 'bg-green-500' },
    { title: 'Pending Amount', value: '$3,200', icon: Clock, change: '-$800', color: 'bg-orange-500' },
    { title: 'Completed Projects', value: '12', icon: CheckCircle, change: '+2', color: 'bg-purple-500' },
  ];

  const recentInvoices = [
    {
      id: 'INV-2024-001',
      description: 'Website Development - Phase 1',
      amount: 2500,
      status: 'paid',
      date: '2024-01-15',
      dueDate: '2024-01-30',
    },
    {
      id: 'INV-2024-002',
      description: 'Logo Design & Branding',
      amount: 1800,
      status: 'pending',
      date: '2024-01-20',
      dueDate: '2024-02-05',
    },
    {
      id: 'INV-2024-003',
      description: 'SEO Optimization Package',
      amount: 1200,
      status: 'pending',
      date: '2024-01-25',
      dueDate: '2024-02-10',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Calendar className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">MJ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {clientStats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-2">this month</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Invoices */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.id}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{invoice.description}</p>
                        <p className="text-xs text-gray-500">
                          Issued: {invoice.date} | Due: {invoice.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${invoice.amount.toLocaleString()}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Invoices
              </button>
            </div>
          </div>

          {/* Account Info & Actions */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Account Summary</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Invoiced</span>
                    <span className="text-sm font-medium text-gray-900">$21,650</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount Paid</span>
                    <span className="text-sm font-medium text-green-600">$18,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Outstanding</span>
                    <span className="text-sm font-medium text-orange-600">$3,200</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Payment Rate</span>
                      <span className="text-sm font-medium text-gray-900">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Make Payment
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipts
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;