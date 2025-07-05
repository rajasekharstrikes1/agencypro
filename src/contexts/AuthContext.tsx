import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AuthContextType, Permission, ROLE_PERMISSIONS } from '../types';
import { Timestamp } from 'firebase/firestore';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock authentication - in a real app, this would connect to your auth service
  useEffect(() => {
    // Simulate loading user data
    const mockUser: UserProfile = {
      id: '1',
      uid: 'firebase-uid-123',
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
      isActive: true,
      createdBy: 'system',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    };
    
    setTimeout(() => {
      setUserProfile(mockUser);
      setLoading(false);
    }, 1000);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Mock login logic - determine role based on email
    let role = UserRole.SUPER_ADMIN;
    let tenantId: string | undefined = undefined;
    
    if (email.includes('tenant')) {
      role = UserRole.TENANT_ADMIN;
      tenantId = 'tenant-123';
    } else if (email.includes('admin')) {
      role = UserRole.ADMIN;
      tenantId = 'tenant-123';
    } else if (email.includes('employee')) {
      role = UserRole.EMPLOYEE;
      tenantId = 'tenant-123';
    } else if (email.includes('client')) {
      role = UserRole.CLIENT;
      tenantId = 'tenant-123';
    }
    
    const mockUser: UserProfile = {
      id: '1',
      uid: 'firebase-uid-123',
      email,
      name: role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'User',
      role,
      tenantId,
      permissions: ROLE_PERMISSIONS[role],
      isActive: true,
      createdBy: 'system',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    };
    
    setTimeout(() => {
      setUserProfile(mockUser);
      setLoading(false);
    }, 1000);
  };

  const logout = async () => {
    setUserProfile(null);
  };

  const hasPermission = (permission: Permission): boolean => {
    return userProfile?.permissions.includes(permission) || false;
  };

  const isAuthenticated = !!userProfile;

  return (
    <AuthContext.Provider value={{
      userProfile,
      loading,
      login,
      logout,
      isAuthenticated,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};