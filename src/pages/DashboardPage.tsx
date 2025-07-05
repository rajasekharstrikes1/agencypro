import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import SuperAdminDashboard from './SuperAdminDashboard';
import ClientDashboard from './Dashboard/ClientDashboard';
import AgencyDashboard from '../components/Dashboard/AgencyDashboard';

const DashboardPage: React.FC = () => {
  const { userProfile, loading } = useAuth();

  // Show a loading spinner while we wait for the user's profile to load
  if (loading || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-600"></div>
          <p className="mt-4 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check the user's role and render the correct dashboard
  switch (userProfile.role) {
    case UserRole.SUPER_ADMIN:
      return <SuperAdminDashboard />;
    case UserRole.CLIENT:
    case UserRole.CLIENT_USER:
      return <ClientDashboard />;
    // Any other roles (TENANT_ADMIN, ADMIN, EMPLOYEE) will see the main agency dashboard
    default:
      return <AgencyDashboard />;
  }
};

export default DashboardPage;