import { Subscription, SubscriptionStatus, SUBSCRIPTION_PLANS } from '../types';

export const isSubscriptionActive = (subscription: Subscription | null): boolean => {
  if (!subscription) return false;
  
  const now = new Date();
  const endDate = subscription.endDate.toDate();
  
  return subscription.status === SubscriptionStatus.ACTIVE && endDate > now;
};

export const isTrialActive = (subscription: Subscription | null): boolean => {
  if (!subscription) return false;
  
  const now = new Date();
  const trialEndDate = subscription.trialEndDate?.toDate();
  
  return subscription.status === SubscriptionStatus.TRIAL && 
         trialEndDate && 
         trialEndDate > now;
};

export const getDaysUntilExpiry = (subscription: Subscription | null): number => {
  if (!subscription) return 0;
  
  const now = new Date();
  const endDate = subscription.endDate.toDate();
  
  return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const canCreateMoreLeads = (
  currentCount: number, 
  subscription: Subscription | null
): boolean => {
  if (!subscription) return false;
  
  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  return plan.maxLeads === -1 || currentCount < plan.maxLeads;
};

export const canCreateMoreInvoices = (
  currentCount: number, 
  subscription: Subscription | null
): boolean => {
  if (!subscription) return false;
  
  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  return plan.maxInvoices === -1 || currentCount < plan.maxInvoices;
};

export const canAddMoreUsers = (
  currentCount: number, 
  subscription: Subscription | null
): boolean => {
  if (!subscription) return false;
  
  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  return plan.maxUsers === -1 || currentCount < plan.maxUsers;
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};