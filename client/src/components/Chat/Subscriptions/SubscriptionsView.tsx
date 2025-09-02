import React, { useEffect, useState } from 'react';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
} from '@librechat/client';
import { useAuthContext } from '~/hooks';

type SubscriptionPackage = {
  title: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
};

type SubscriptionStatus = {
  status: 'active' | 'cancelled' | 'expired' | 'inactive';
  plan?: string;
  billingCycle?: 'monthly' | 'yearly';
  startedAt?: Date;
  expiresAt?: Date;
};

export default function Subscriptions({ open, onOpenChange }) {
  const { token } = useAuthContext();
  const [subscriptionPackages, setSubscriptionPackages] = useState<SubscriptionPackage[]>([]);
  const [currentPlan, setCurrentPlan] = useState('Basic');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ status: 'none' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch subscription packages
    fetch('/api/subscription')
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error('Response is not valid JSON: ' + text.slice(0, 100));
        }
      })
      .then((data) => {
        let packages: SubscriptionPackage[] = [];
        if (Array.isArray(data)) {
          packages = data.map(pkg => ({
            title: pkg.title,
            priceMonthly: pkg.priceMonthly,
            priceYearly: pkg.priceYearly,
            description: pkg.description,
            features: pkg.features || pkg.feature || [],
          }));
        } else if (Array.isArray(data.packages)) {
          packages = data.packages.map(pkg => ({
            title: pkg.title,
            priceMonthly: pkg.priceMonthly,
            priceYearly: pkg.priceYearly,
            description: pkg.description,
            features: pkg.features || pkg.feature || [],
          }));
        } else if (data && typeof data === 'object') {
          packages = [{
            title: data.title,
            priceMonthly: data.priceMonthly,
            priceYearly: data.priceYearly,
            description: data.description,
            features: data.features || data.feature || [],
          }];
        }
        setSubscriptionPackages(packages);
      })
      .catch((err) => {
        console.error('Failed to fetch subscriptions:', err);
        setSubscriptionPackages([]);
      });

    // Fetch current user subscription status
    if (token) {
      fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(userData => {
        if (userData.subscription) {
          setSubscriptionStatus({
            status: userData.subscription.status || 'inactive',
            plan: userData.subscription.plan,
            billingCycle: userData.subscription.billingCycle || "none",
            startedAt: userData.subscription.startedAt ? new Date(userData.subscription.startedAt) : undefined,
            expiresAt: userData.subscription.expiresAt ? new Date(userData.subscription.expiresAt) : undefined
          });
          setCurrentPlan(userData.subscription.plan || 'Free Plan');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch user subscription:', err);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [token]);

  /** Handle checkout Stripe */
  const handleUpgrade = async (planTitle: string) => {
    try {
      if (!token) {
        throw new Error('User not logged in or token not found.');
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: planTitle,
          billingCycle,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const responseData = await res.json();
      console.log('Full response data:', responseData);
      
      const { url } = responseData;

      if (url) {
        console.log('Redirecting to:', url);
        window.location.href = url; // redirect ke Stripe
      } else {
        console.error('No URL in response:', responseData);
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memproses pembayaran. Coba lagi.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'expired': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✓';
      case 'cancelled': return '✗';
      case 'expired': return '⚠';
      default: return '○';
    }
  };

  if (isLoading) {
    return (
      <OGDialog open={open} onOpenChange={onOpenChange}>
        <OGDialogContent className="w-[95vw] md:w-[90vw] lg:w-[800px] bg-background text-text-primary shadow-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </OGDialogContent>
      </OGDialog>
    );
  }

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent
        title="Subscription Plans"
        className="w-[95vw] md:w-[90vw] lg:w-[800px] bg-background text-text-primary shadow-2xl"
      >
        <OGDialogHeader>
          <OGDialogTitle>Subscription Plans</OGDialogTitle>
        </OGDialogHeader>

        {/* Current Subscription Status */}
        {subscriptionStatus.status !== 'none' && (
          <div className="mb-6 p-4 rounded-lg border border-border-primary bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${subscriptionStatus.status === 'active' ? 'bg-green-500' : subscriptionStatus.status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                <h3 className="text-lg font-semibold text-token-text-primary">
                  Current Subscription
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscriptionStatus.status)}`}>
                {getStatusIcon(subscriptionStatus.status)} {subscriptionStatus.status.charAt(0).toUpperCase() + subscriptionStatus.status.slice(1)}
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-token-text-secondary">Plan:</span>
                  <span className="text-sm font-medium text-token-text-primary">{subscriptionStatus.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-token-text-secondary">Billing Cycle:</span>
                  <span className="text-sm font-medium text-token-text-primary capitalize">{subscriptionStatus.billingCycle}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-token-text-secondary">Started:</span>
                  <span className="text-sm font-medium text-token-text-primary">
                    {subscriptionStatus.startedAt ? formatDate(subscriptionStatus.startedAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-token-text-secondary">Expires:</span>
                  <span className="text-sm font-medium text-token-text-primary">
                    {subscriptionStatus.expiresAt ? formatDate(subscriptionStatus.expiresAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="flex flex-wrap justify-center gap-6">
          {subscriptionPackages.map((pkg) => {
            const displayPrice =
              billingCycle === 'monthly'
                ? pkg.priceMonthly
                : pkg.priceYearly;
            
            const isCurrentPlan = subscriptionStatus.plan === pkg.title;
            const canUpgrade = subscriptionStatus.status !== 'active' || !isCurrentPlan;

            return (
              <div
                key={pkg.title}
                className={`relative rounded-xl border-2 p-6 flex flex-col items-center text-center w-full max-w-sm transition-all duration-200 hover:shadow-lg ${
                  isCurrentPlan
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg'
                    : 'border-border-primary hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                      Current Plan
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-bold text-token-text-primary mb-2">{pkg.title}</h3>

                {/* Toggle Monthly / Yearly */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        billingCycle === 'monthly' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-token-text-secondary hover:text-token-text-primary'
                      }`}
                      onClick={() => setBillingCycle('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        billingCycle === 'yearly' 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-token-text-secondary hover:text-token-text-primary'
                      }`}
                      onClick={() => setBillingCycle('yearly')}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-token-text-primary">${displayPrice}</span>
                  <span className="text-sm text-token-text-secondary">/{billingCycle}</span>
                </div>

                <p className="text-sm text-token-text-secondary mb-4">{pkg.description}</p>

                {/* Features */}
                <ul className="mb-6 text-sm text-token-text-secondary text-left list-none space-y-2 w-full">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {isCurrentPlan ? (
                  <div className="mt-auto p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-full">
                    <div className="text-green-700 dark:text-green-400 font-medium text-sm">
                      ✓ Active Subscription
                    </div>
                  </div>
                ) : canUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(pkg.title)}
                    className="mt-auto w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscriptionStatus.status === 'active' ? 'Change Plan' : 'Upgrade Now'}
                  </button>
                ) : (
                  <div className="mt-auto p-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-full">
                    <div className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                      {subscriptionStatus.status === 'cancelled' ? 'Subscription Cancelled' : 'Subscription Expired'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
