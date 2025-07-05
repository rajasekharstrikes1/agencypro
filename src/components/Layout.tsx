import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Settings, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Briefcase,
  Building2,
  UserCog,
  Shield,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Permission, UserRole, SubscriptionStatus } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    currentUser, 
    userProfile, 
    currentTenant, 
    currentSubscription,
    logout, 
    hasPermission, 
    isRole,
    canAccessModule,
    isSubscriptionActive
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [];

    // Dashboard for everyone
    items.push({
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: Permission.VIEW_DASHBOARD
    });

    // Super Admin specific items
    if (isRole(UserRole.SUPER_ADMIN)) {
      items.push(
        {
          name: 'Tenant Management',
          href: '/admin/tenants',
          icon: Building2,
          permission: Permission.MANAGE_ALL_TENANTS
        },
        {
          name: 'User Management',
          href: '/admin/users',
          icon: UserCog,
          permission: Permission.MANAGE_TENANT_USERS
        }
      );
    } else {
      // Tenant-specific items
      if (canAccessModule('leads')) {
        items.push({
          name: 'Leads',
          href: '/leads',
          icon: Briefcase,
          permission: Permission.VIEW_LEADS
        });
      }

      if (canAccessModule('invoices') && !isRole(UserRole.CLIENT_USER)) {
        items.push(
          {
            name: 'Invoices',
            href: '/invoices',
            icon: FileText,
            permission: Permission.VIEW_INVOICES
          },
          {
            name: 'Customers',
            href: '/customers',
            icon: Users,
            permission: Permission.VIEW_CUSTOMERS
          }
        );
      }

      // Subscription management for tenant admins
      if (isRole(UserRole.TENANT_ADMIN)) {
        items.push({
          name: 'Subscription',
          href: '/subscription',
          icon: CreditCard,
          permission: Permission.MANAGE_TENANT_SETTINGS
        });
      }

      // User management for tenant admins
      if (hasPermission(Permission.MANAGE_TENANT_USERS)) {
        items.push({
          name: 'Team',
          href: '/admin/users',
          icon: UserCog,
          permission: Permission.MANAGE_TENANT_USERS
        });
      }
    }

    // Settings for everyone
    items.push({
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: null
    });

    return items.filter(item => !item.permission || hasPermission(item.permission));
  };

  const navigationItems = getNavigationItems();
  const displayName = userProfile?.name || currentUser?.email || 'User';
  const organizationName = isRole(UserRole.SUPER_ADMIN) 
    ? 'VRITIX - Super Admin' 
    : currentTenant?.name || 'Agency Pro';

  // Show subscription warning for tenant users
  const showSubscriptionWarning = () => {
    if (isRole(UserRole.SUPER_ADMIN) || !currentSubscription) return null;

    const daysUntilExpiry = Math.ceil(
      (currentSubscription.endDate.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (currentSubscription.status === SubscriptionStatus.TRIAL && daysUntilExpiry <= 7) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Trial expires in {daysUntilExpiry} days. 
                <NavLink to="/subscription" className="font-medium underline ml-1">
                  Upgrade now
                </NavLink>
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!isSubscriptionActive()) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Subscription expired. 
                <NavLink to="/subscription" className="font-medium underline ml-1">
                  Renew now
                </NavLink>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div>
              <h1 className="text-lg font-bold text-primary">{organizationName}</h1>
              <p className="text-xs text-gray-500">
                {userProfile?.role.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 px-4 py-4">
            {showSubscriptionWarning()}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-secondary text-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div>
              <h1 className="text-xl font-bold text-primary">{organizationName}</h1>
              <p className="text-xs text-gray-500">
                {userProfile?.role.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-1 flex-col">
            {showSubscriptionWarning()}
            <nav className="flex-1">
              <ul role="list" className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isActive
                            ? 'bg-secondary text-primary'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate">{displayName}</span>
                <span className="block text-xs text-gray-500 truncate">
                  {userProfile?.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <LogOut className="h-6 w-6 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {userProfile && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>{userProfile.role.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  {currentTenant && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>{currentTenant.name}</span>
                    </div>
                  )}
                  {currentSubscription && (
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        currentSubscription.status === SubscriptionStatus.ACTIVE
                          ? 'bg-green-100 text-green-800'
                          : currentSubscription.status === SubscriptionStatus.TRIAL
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {currentSubscription.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;