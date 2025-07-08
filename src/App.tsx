import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AgencyRegistration from './components/Auth/AgencyRegistration';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import LeadsPage from './pages/LeadsPage';
import SettingsPage from './pages/SettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTenantsPage from './pages/AdminTenantsPage';
import AdminSubscriptionPlansPage from './pages/AdminSubscriptionPlansPage';
import AdminPaymentGatewayPage from './pages/AdminPaymentGatewayPage';
import AdminDiscountCodesPage from './pages/AdminDiscountCodesPage';
import SubscriptionManagement from './pages/SubscriptionManagement';
import { Permission } from './types';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register-agency" element={<AgencyRegistration />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/invoices" element={
                          <ProtectedRoute requiredModule="invoices">
                            <InvoicesPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/customers" element={
                          <ProtectedRoute requiredModule="invoices">
                            <CustomersPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/leads" element={
                          <ProtectedRoute requiredModule="leads">
                            <LeadsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/subscription" element={<SubscriptionManagement />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/tenants" element={<AdminTenantsPage />} />
                        <Route path="/admin/subscription-plans" element={
                          <ProtectedRoute requiredPermission={Permission.MANAGE_SUBSCRIPTIONS}>
                            <AdminSubscriptionPlansPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin/payment-gateway" element={
                          <ProtectedRoute requiredPermission={Permission.MANAGE_PAYMENT_GATEWAY}>
                            <AdminPaymentGatewayPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin/discount-codes" element={
                          <ProtectedRoute requiredPermission={Permission.MANAGE_DISCOUNT_CODES}>
                            <AdminDiscountCodesPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/register" element={
                          <ProtectedRoute requiredPermission={Permission.MANAGE_USERS}>
                            <Register />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;