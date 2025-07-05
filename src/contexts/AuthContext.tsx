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
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
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
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        setUserProfile(profile);

        // Load tenant if user belongs to one
        if (profile.tenantId) {
          await loadTenant(profile.tenantId);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadTenant = async (tenantId: string) => {
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (tenantDoc.exists()) {
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;
        setCurrentTenant(tenant);

        // Load subscription if tenant has one
        if (tenant.subscriptionId) {
          await loadSubscription(tenant.subscriptionId);
        } else {
          // Look for subscription by tenantId
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
            setCurrentSubscription(subscription);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
    }
  };

  const loadSubscription = async (subscriptionId: string) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (subscriptionDoc.exists()) {
        const subscription = { id: subscriptionDoc.id, ...subscriptionDoc.data() } as Subscription;
        setCurrentSubscription(subscription);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      if (result.user) {
        await updateDoc(doc(db, 'users', result.user.uid), {
          lastLogin: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userProfile: Omit<UserProfile, 'id'> = {
        uid: result.user.uid,
        email: result.user.email!,
        name: userData.name || '',
        role: userData.role || UserRole.TENANT_ADMIN,
        tenantId: userData.tenantId,
        permissions: ROLE_PERMISSIONS[userData.role || UserRole.TENANT_ADMIN],
        isActive: true, // Always set to true for new registrations
        createdBy: userData.createdBy,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const registerAgency = async (agencyData: any, adminData: any) => {
    try {
      // Create admin user first
      const result = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
      
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
          maxUsers: 5, // Default for trial
          customBranding: false
        },
        contactInfo: {
          email: agencyData.contactEmail,
          phone: agencyData.contactPhone,
          address: agencyData.address
        }
      };

      const tenantRef = await setDoc(doc(collection(db, 'tenants')), tenantData);
      const tenantId = tenantRef.id;

      // Create trial subscription
      const subscriptionData = {
        tenantId: tenantId,
        plan: SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.TRIAL,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
        trialEndDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        amount: 0,
        currency: 'INR',
        autoRenew: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const subscriptionRef = await setDoc(doc(collection(db, 'subscriptions')), subscriptionData);

      // Update tenant with subscription ID
      await updateDoc(doc(db, 'tenants', tenantId), {
        subscriptionId: subscriptionRef.id
      });

      // Create admin user profile
      const userProfile: Omit<UserProfile, 'id'> = {
        uid: result.user.uid,
        email: result.user.email!,
        name: adminData.name,
        role: UserRole.TENANT_ADMIN,
        tenantId: tenantId,
        permissions: ROLE_PERMISSIONS[UserRole.TENANT_ADMIN],
        isActive: true, // Always set to true for agency registration
        createdBy: 'self-registration',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);

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
    isSubscriptionActive
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};