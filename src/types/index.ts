import { Timestamp } from 'firebase/firestore';

// Subscription and Payment Types
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended'
}

export enum SubscriptionPlan {
  TRIAL = 'trial',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  features: string[];
  maxUsers: number;
  maxLeads: number;
  maxInvoices: number;
  trialDays: number;
}

export interface Subscription {
  id?: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  trialEndDate?: Timestamp;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Payment {
  id?: string;
  tenantId: string;
  subscriptionId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentDate: Timestamp;
  createdAt: Timestamp;
}

// Role and Permission Types
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  CLIENT = 'client',
  CLIENT_USER = 'client_user'
}

export enum Permission {
  // Super Admin permissions
  MANAGE_ALL_TENANTS = 'manage_all_tenants',
  MANAGE_TENANTS = 'manage_tenants',
  VIEW_ALL_ANALYTICS = 'view_all_analytics',
  MANAGE_SUBSCRIPTIONS = 'manage_subscriptions',
  MANAGE_PAYMENTS = 'manage_payments',
  
  // Tenant Admin permissions
  MANAGE_TENANT_USERS = 'manage_tenant_users',
  MANAGE_USERS = 'manage_users',
  MANAGE_TENANT_SETTINGS = 'manage_tenant_settings',
  VIEW_TENANT_ANALYTICS = 'view_tenant_analytics',
  
  // Lead permissions
  VIEW_LEADS = 'view_leads',
  CREATE_LEADS = 'create_leads',
  EDIT_LEADS = 'edit_leads',
  DELETE_LEADS = 'delete_leads',
  MANAGE_LEAD_SETTINGS = 'manage_lead_settings',
  EXPORT_LEADS = 'export_leads',
  
  // Invoice permissions (only for tenant admins and employees)
  VIEW_INVOICES = 'view_invoices',
  CREATE_INVOICES = 'create_invoices',
  EDIT_INVOICES = 'edit_invoices',
  DELETE_INVOICES = 'delete_invoices',
  VIEW_CUSTOMERS = 'view_customers',
  MANAGE_CUSTOMERS = 'manage_customers',
  MANAGE_INVOICE_SETTINGS = 'manage_invoice_settings',
  
  // Dashboard permissions
  VIEW_DASHBOARD = 'view_dashboard'
}

export interface Tenant {
  id?: string;
  name: string;
  domain?: string;
  logo?: string;
  isActive: boolean;
  subscriptionId?: string;
  createdBy: string; // Super admin who created this tenant
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    allowedModules: ('leads' | 'invoices')[];
    maxUsers: number;
    customBranding?: boolean;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
}

export interface UserProfile {
  id?: string;
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string; // null for super_admin, required for others
  permissions: Permission[];
  isActive: boolean;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
}

// Application Data Types
export interface CompanySettings {
  id?: string;
  tenantId?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  gst?: string;
  pan?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  currency?: string;
  logoUrl?: string;
  logoBase64?: string;
  invoicePrefix?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Customer {
  id?: string;
  tenantId?: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gst?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
  gstAmount: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  tenantId?: string;
  userId: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    gst?: string;
  };
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOption {
  id: string;
  tenantId?: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StatusOption {
  id: string;
  tenantId?: string;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export enum LeadStatus {
  CREATED = 'Created',
  FOLLOWUP = 'Followup',
  CLIENT = 'Client',
  REJECTED = 'Rejected',
}

export interface Lead {
  id?: string;
  tenantId?: string;
  userId: string;
  leadDate: string;
  name: string;
  mobileNumber: string;
  emailAddress: string;
  services: string[];
  leadStatus: string;
  notes?: string;
  lastFollowUpDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Analytics Types
export interface TenantAnalytics {
  tenantId: string;
  totalLeads: number;
  totalInvoices: number;
  totalRevenue: number;
  activeUsers: number;
  lastUpdated: Timestamp;
}

export interface SuperAdminAnalytics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalRevenue: number;
  totalUsers: number;
  recentRegistrations: number;
  lastUpdated: Timestamp;
}

// Auth Context Type
export interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.MANAGE_ALL_TENANTS,
    Permission.MANAGE_TENANTS,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.MANAGE_SUBSCRIPTIONS,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_TENANT_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_DASHBOARD
  ],
  [UserRole.TENANT_ADMIN]: [
    Permission.MANAGE_TENANT_USERS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_TENANT_SETTINGS,
    Permission.VIEW_TENANT_ANALYTICS,
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.DELETE_LEADS,
    Permission.MANAGE_LEAD_SETTINGS,
    Permission.EXPORT_LEADS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.DELETE_INVOICES,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.MANAGE_INVOICE_SETTINGS,
    Permission.VIEW_DASHBOARD
  ],
  [UserRole.ADMIN]: [
    Permission.MANAGE_TENANT_USERS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_TENANT_SETTINGS,
    Permission.VIEW_TENANT_ANALYTICS,
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.DELETE_LEADS,
    Permission.MANAGE_LEAD_SETTINGS,
    Permission.EXPORT_LEADS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.DELETE_INVOICES,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.MANAGE_INVOICE_SETTINGS,
    Permission.VIEW_DASHBOARD
  ],
  [UserRole.EMPLOYEE]: [
    Permission.VIEW_LEADS,
    Permission.CREATE_LEADS,
    Permission.EDIT_LEADS,
    Permission.EXPORT_LEADS,
    Permission.VIEW_INVOICES,
    Permission.CREATE_INVOICES,
    Permission.EDIT_INVOICES,
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.VIEW_DASHBOARD
  ],
  [UserRole.CLIENT]: [
    Permission.VIEW_LEADS,
    Permission.EDIT_LEADS,
    Permission.VIEW_DASHBOARD
  ],
  [UserRole.CLIENT_USER]: [
    Permission.VIEW_LEADS,
    Permission.EDIT_LEADS,
    Permission.VIEW_DASHBOARD
  ]
};

// Subscription plan configurations
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  [SubscriptionPlan.TRIAL]: {
    id: SubscriptionPlan.TRIAL,
    name: 'Free Trial',
    price: 0,
    currency: 'INR',
    features: ['Up to 100 leads', 'Basic dashboard', 'Email support'],
    maxUsers: 2,
    maxLeads: 100,
    maxInvoices: 50,
    trialDays: 30
  },
  [SubscriptionPlan.BASIC]: {
    id: SubscriptionPlan.BASIC,
    name: 'Basic Plan',
    price: 2999,
    currency: 'INR',
    features: ['Up to 1000 leads', 'Invoice management', 'Priority support', 'Basic analytics'],
    maxUsers: 5,
    maxLeads: 1000,
    maxInvoices: 500,
    trialDays: 0
  },
  [SubscriptionPlan.PREMIUM]: {
    id: SubscriptionPlan.PREMIUM,
    name: 'Premium Plan',
    price: 4999,
    currency: 'INR',
    features: ['Unlimited leads', 'Advanced analytics', 'Custom branding', 'API access', '24/7 support'],
    maxUsers: 15,
    maxLeads: -1, // Unlimited
    maxInvoices: -1, // Unlimited
    trialDays: 0
  },
  [SubscriptionPlan.ENTERPRISE]: {
    id: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise Plan',
    price: 9999,
    currency: 'INR',
    features: ['Everything in Premium', 'White-label solution', 'Dedicated support', 'Custom integrations'],
    maxUsers: -1, // Unlimited
    maxLeads: -1, // Unlimited
    maxInvoices: -1, // Unlimited
    trialDays: 0
  }
};