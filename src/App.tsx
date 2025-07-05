// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import LeadsPage from './pages/LeadsPage';
import SettingsPage from './pages/SettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTenantsPage from './pages/AdminTenantsPage';
import SubscriptionManagement from './pages/SubscriptionManagement';
import { Permission } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/subscription" element={<SubscriptionManagement />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/tenants" element={<AdminTenantsPage />} />
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
  );
};

export default App;