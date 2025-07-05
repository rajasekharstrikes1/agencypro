import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, SubscriptionStatus } from '../../types';
import { AlertTriangle, CreditCard, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredModule?: 'leads' | 'invoices';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  requiredModule,
  fallbackPath = '/login'
}) => {
  const { 
    currentUser, 
    userProfile, 
    currentTenant,
    currentSubscription,
    hasPermission, 
    canAccessModule,
    isSubscriptionActive 
  } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userProfile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <Lock className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Inactive</h2>
          <p className="text-gray-600 mb-4">Your account has been deactivated. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Check subscription status for tenant users
  if (userProfile.tenantId && currentSubscription) {
    if (currentSubscription.status === SubscriptionStatus.EXPIRED) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Expired</h2>
            <p className="text-gray-600 mb-4">Your subscription has expired. Please contact your administrator to renew.</p>
          </div>
        </div>
      );
    }

    if (currentSubscription.status === SubscriptionStatus.SUSPENDED) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Account Suspended</h2>
            <p className="text-gray-600 mb-4">Your account has been suspended. Please contact support.</p>
          </div>
        </div>
      );
    }
  }

  // Check module access
  if (requiredModule && !canAccessModule(requiredModule)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <Lock className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Module Not Available</h2>
          <p className="text-gray-600 mb-4">
            The {requiredModule} module is not available in your current plan. Please upgrade your subscription.
          </p>
        </div>
      </div>
    );
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;