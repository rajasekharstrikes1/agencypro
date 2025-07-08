import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { 
  UserProfile, 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  Tenant, 
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan 
} from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  currentTenant: Tenant | null;
  currentSubscription: Subscription | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  registerAgency: (agencyData: any, adminData: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  isRole: (role: UserRole) => boolean;
  canAccessModule: (module: 'leads' | 'invoices') => boolean;
  isSubscriptionActive: () => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setCurrentUser(user);
      
      if (user) {
        try {
          await loadUserProfile(user.uid);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Don't throw error, just set states to null
          setUserProfile(null);
          setCurrentTenant(null);
          setCurrentSubscription(null);
        }
      } else {
        setUserProfile(null);
        setCurrentTenant(null);
        setCurrentSubscription(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      console.log('Loading user profile for:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const profile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        console.log('User profile loaded:', profile);
        
        setUserProfile(profile);

        // Load tenant if user belongs to one (not for super admin)
        if (profile.tenantId && profile.role !== UserRole.SUPER_ADMIN) {
          await loadTenant(profile.tenantId);
        } else {
          // For super admin or users without tenant
          setCurrentTenant(null);
          setCurrentSubscription(null);
        }
      } else {
        console.log('No user profile found for:', uid);
        // Create a basic profile for users without one
        const basicProfile: Omit<UserProfile, 'id'> = {
          uid: uid,
          email: auth.currentUser?.email || '',
          name: auth.currentUser?.displayName || 'User',
          role: UserRole.EMPLOYEE,
          permissions: ROLE_PERMISSIONS[UserRole.EMPLOYEE],
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          lastLogin: Timestamp.now()
        };
        
        await setDoc(doc(db, 'users', uid), basicProfile);
        setUserProfile({ id: uid, ...basicProfile });
        setCurrentTenant(null);
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  };

  const loadTenant = async (tenantId: string) => {
    try {
      console.log('Loading tenant:', tenantId);
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      
      if (tenantDoc.exists()) {
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
        console.log('Tenant loaded:', tenant);
        setCurrentTenant(tenant);

        // Load subscription
        await loadSubscription(tenantId);
      } else {
        console.log('No tenant found for:', tenantId);
        setCurrentTenant(null);
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      setCurrentTenant(null);
      setCurrentSubscription(null);
    }
  };

  const loadSubscription = async (tenantId: string) => {
    try {
      console.log('Loading subscription for tenant:', tenantId);
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('tenantId', '==', tenantId)
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      if (!subscriptionsSnapshot.empty) {
        const subscription = {
          id: subscriptionsSnapshot.docs[0].id,
          ...subscriptionsSnapshot.docs[0].data()
        } as Subscription;
        console.log('Subscription loaded:', subscription);
        setCurrentSubscription(subscription);
      } else {
        console.log('No subscription found for tenant:', tenantId);
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setCurrentSubscription(null);
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser.uid);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful for:', result.user.uid);
      
      // Update last login
      try {
        const userDocRef = doc(db, 'users', result.user.uid);
        await updateDoc(userDocRef, {
          lastLogin: Timestamp.now()
        });
        console.log('Last login updated');
      } catch (updateError) {
        console.warn('Failed to update last login:', updateError);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      console.log('Attempting registration for:', email);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful for:', result.user.uid);
      
      const userProfile: Omit<UserProfile, 'id'> = {
        uid: result.user.uid,
        email: result.user.email!,
        name: userData.name || '',
        role: userData.role || UserRole.EMPLOYEE,
        tenantId: userData.tenantId,
        permissions: ROLE_PERMISSIONS[userData.role || UserRole.EMPLOYEE],
        isActive: true,
        createdBy: userData.createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      console.log('User profile created');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const registerAgency = async (agencyData: any, adminData: any) => {
    try {
      console.log('Attempting agency registration for:', adminData.email);
      
      // Create admin user first
      const result = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
      console.log('Admin user created:', result.user.uid);
      
      // Create tenant
      const tenantData: Omit<Tenant, 'id'> = {
        name: agencyData.name,
        domain: agencyData.domain || undefined,
        isActive: true,
        createdBy: result.user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        settings: {
          allowedModules: agencyData.selectedModules,
          maxUsers: 5,
          customBranding: false
        },
        contactInfo: {
          email: agencyData.contactEmail,
          phone: agencyData.contactPhone,
          address: agencyData.address
        }
      };

      const tenantDocRef = doc(collection(db, 'tenants'));
      await setDoc(tenantDocRef, tenantData);
      const tenantId = tenantDocRef.id;
      console.log('Tenant created:', tenantId);

      // Create trial subscription
      const subscriptionData = {
        tenantId: tenantId,
        plan: SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.TRIAL,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        trialEndDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        amount: 0,
        currency: 'INR',
        autoRenew: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const subscriptionDocRef = doc(collection(db, 'subscriptions'));
      await setDoc(subscriptionDocRef, subscriptionData);
      console.log('Subscription created:', subscriptionDocRef.id);

      // Update tenant with subscription ID
      await updateDoc(doc(db, 'tenants', tenantId), {
        subscriptionId: subscriptionDocRef.id
      });

      // Create admin user profile
      const userProfile: Omit<UserProfile, 'id'> = {
        uid: result.user.uid,
        email: result.user.email!,
        name: adminData.name,
        role: UserRole.TENANT_ADMIN,
        tenantId: tenantId,
        permissions: ROLE_PERMISSIONS[UserRole.TENANT_ADMIN],
        isActive: true,
        createdBy: 'self-registration',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      console.log('Admin user profile created');
      
    } catch (error) {
      console.error('Agency registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setCurrentTenant(null);
      setCurrentSubscription(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return userProfile?.permissions.includes(permission) || false;
  };

  const isRole = (role: UserRole): boolean => {
    return userProfile?.role === role;
  };

  const canAccessModule = (module: 'leads' | 'invoices'): boolean => {
    if (isRole(UserRole.SUPER_ADMIN)) return true;
    if (!currentTenant) return false;
    
    return currentTenant.settings?.allowedModules?.includes(module) || false;
  };

  const isSubscriptionActive = (): boolean => {
    if (isRole(UserRole.SUPER_ADMIN)) return true;
    if (!currentSubscription) return false;
    
    const now = new Date();
    const endDate = currentSubscription.endDate.toDate();
    
    return (
      currentSubscription.status === SubscriptionStatus.ACTIVE ||
      currentSubscription.status === SubscriptionStatus.TRIAL
    ) && endDate > now;
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    currentTenant,
    currentSubscription,
    loading,
    login,
    register,
    registerAgency,
    logout,
    hasPermission,
    isRole,
    canAccessModule,
    isSubscriptionActive,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};