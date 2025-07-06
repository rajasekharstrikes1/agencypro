import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import SuperAdminDashboard from './SuperAdminDashboard';
import ClientDashboard from './Dashboard/ClientDashboard';
import AgencyDashboard from './Dashboard/AgencyDashboard';

const DashboardPage: React.FC = () => {
  const { userProfile, loading } = useAuth();

  // Show a loading spinner while we wait for the user's profile to load
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user profile is loaded, show error state
  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            There was an issue loading your profile. Please try refreshing the page or contact support if the problem persists.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh Page
          </button>
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