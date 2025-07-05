import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserRole, Tenant, Permission } from '../types';
import { Plus, Edit, Trash2, Users, Shield, Building2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsersPage: React.FC = () => {
  const { userProfile, hasPermission, isRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterTenant, setFilterTenant] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (hasPermission(Permission.MANAGE_TENANT_USERS) || hasPermission(Permission.MANAGE_ALL_TENANTS)) {
      fetchUsers();
      fetchTenants();
    }
  }, [hasPermission]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      let usersQuery = usersRef;

      // If not super admin, filter by tenant
      if (!isRole(UserRole.SUPER_ADMIN) && userProfile?.tenantId) {
        usersQuery = query(usersRef, where('tenantId', '==', userProfile.tenantId));
      }

      const querySnapshot = await getDocs(usersQuery);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const tenantsRef = collection(db, 'tenants');
      const querySnapshot = await getDocs(tenantsRef);
      const tenantsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];
      setTenants(tenantsList);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        isActive: !isActive,
        updatedAt: new Date()
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: !isActive } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return 'Agency (No Tenant)';
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name || 'Unknown Tenant';
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.TENANT_ADMIN:
        return 'bg-blue-100 text-blue-800';
      case UserRole.ADMIN:
        return 'bg-indigo-100 text-indigo-800';
      case UserRole.EMPLOYEE:
        return 'bg-green-100 text-green-800';
      case UserRole.CLIENT:
        return 'bg-orange-100 text-orange-800';
      case UserRole.CLIENT_USER:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === '' || user.role === filterRole;
    const matchesTenant = filterTenant === '' || 
      (filterTenant === 'no-tenant' && !user.tenantId) ||
      user.tenantId === filterTenant;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesTenant && matchesStatus;
  });

  if (!hasPermission(Permission.MANAGE_TENANT_USERS) && !hasPermission(Permission.MANAGE_ALL_TENANTS)) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to manage users.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users and their access permissions</p>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="filterRole" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              id="filterRole"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="">All Roles</option>
              {isRole(UserRole.SUPER_ADMIN) && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
              <option value={UserRole.TENANT_ADMIN}>Tenant Admin</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.EMPLOYEE}>Employee</option>
              <option value={UserRole.CLIENT}>Client</option>
              <option value={UserRole.CLIENT_USER}>Client User</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filterTenant" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Agency
            </label>
            <select
              id="filterTenant"
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="">All Agencies</option>
              <option value="no-tenant">No Agency (System)</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      {getTenantName(user.tenantId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user.id!, user.isActive)}
                      disabled={user.role === UserRole.SUPER_ADMIN}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${user.role === UserRole.SUPER_ADMIN ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.isActive ? (
                        <>
                          <ToggleRight className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin.toDate()).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDeleteUser(user.id!)}
                        disabled={user.role === UserRole.SUPER_ADMIN}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={user.role === UserRole.SUPER_ADMIN ? 'Cannot delete super admin' : 'Delete user'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole || filterTenant || filterStatus !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Get started by adding your first user.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;