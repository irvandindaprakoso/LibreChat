import React, { useEffect, useState } from 'react';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
} from '@librechat/client';

type SubscriptionPackage = {
  title: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
};

export default function Subscriptions({ open, onOpenChange }) {
  const [subscriptionPackages, setSubscriptionPackages] = useState<SubscriptionPackage[]>([]);
  const [currentPlan, setCurrentPlan] = useState('Basic');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
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

    // Example: simulate fetching the current plan
    setTimeout(() => {
      setCurrentPlan('Pro');
    }, 500);
  }, []);

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent
        title="Subscription Plans"
        className="w-[95vw] md:w-[90vw] lg:w-[800px] bg-background text-text-primary shadow-2xl"
      >
        <OGDialogHeader>
          <OGDialogTitle>Subscription Plans</OGDialogTitle>
        </OGDialogHeader>

        <div className="flex flex-wrap justify-center gap-6">
          {subscriptionPackages.map((pkg) => {
            const displayPrice =
              billingCycle === 'monthly'
                ? pkg.priceMonthly
                : pkg.priceYearly;

            return (
              <div
                key={pkg.title}
                className={`rounded-lg border p-6 flex flex-col items-center text-center w-full max-w-sm ${
                  currentPlan === pkg.title
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-border-primary'
                }`}
              >
                <h3 className="text-lg font-bold text-token-text-primary">{pkg.title}</h3>
                {/* Toggle Monthly / Yearly */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                    <button
                      className={`px-4 py-1 rounded-full ${
                        billingCycle === 'monthly' ? 'bg-blue-600 text-white' : ''
                      }`}
                      onClick={() => setBillingCycle('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      className={`px-4 py-1 rounded-full ${
                        billingCycle === 'yearly' ? 'bg-blue-600 text-white' : ''
                      }`}
                      onClick={() => setBillingCycle('yearly')}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                <p className="text-sm text-token-text-secondary mb-2">
                  ${displayPrice}/{billingCycle}
                </p>

                {/* Hidden input for type */}
                <input type="hidden" name="billingType" value={billingCycle} />

                <p className="text-sm text-token-text-secondary mb-2">{pkg.description}</p>

                <ul className="mb-4 text-sm text-token-text-secondary text-left list-disc list-inside w-full">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="leading-loose">{feat}</li>
                  ))}
                </ul>

                {currentPlan !== pkg.title ? (
                  <button
                    onClick={() =>
                      alert(`Upgrade to ${pkg.title} (${billingCycle})`)
                    }
                    className="mt-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Upgrade
                  </button>
                ) : (
                  <div className="mt-auto text-green-600 dark:text-green-400 font-medium">
                    Your current plan
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
