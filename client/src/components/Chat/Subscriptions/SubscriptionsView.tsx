import React, { useEffect, useState } from 'react';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
} from '@librechat/client';

type SubscriptionPackage = {
  title: string;
  price: number;
  description: string;
  features: string[];
};

export default function Subscriptions({ open, onOpenChange }) {
  const [subscriptionPackages, setSubscriptionPackages] = useState<SubscriptionPackage[]>([]);
  const [currentPlan, setCurrentPlan] = useState('Basic');

  useEffect(() => {
    // Fetch subscription packages from API
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
        console.log('Fetched subscription data:', data);
        let packages: SubscriptionPackage[] = [];
        if (Array.isArray(data)) {
          packages = data.map(pkg => ({
            title: pkg.title,
            price: pkg.price,
            description: pkg.description,
            features: pkg.features || pkg.feature || [],
          }));
        } else if (Array.isArray(data.packages)) {
          packages = data.packages.map(pkg => ({
            title: pkg.title,
            price: pkg.price,
            description: pkg.description,
            features: pkg.features || pkg.feature || [],
          }));
        } else if (data && typeof data === 'object') {
          packages = [{
            title: data.title,
            price: data.price,
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

        <div className="flex justify-center">
          {subscriptionPackages.map((pkg) => (
            <div
              key={pkg.title}
              className={`rounded-lg border p-6 flex flex-col items-center text-center w-full max-w-sm ${
                currentPlan === pkg.title
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-border-primary'
              }`}
            >
              <h3 className="text-lg font-bold text-token-text-primary">{pkg.title}</h3>
              <p className="text-sm text-token-text-secondary mb-2">${pkg.price}/month</p>
              <p className="text-sm text-token-text-secondary mb-2">{pkg.description}</p>
              
              <ul className="mb-4 text-sm text-token-text-secondary text-left list-disc list-inside w-full">
                {pkg.features.map((feat, i) => (
                    <li key={i} className="leading-loose">{feat}</li>
                ))}
              </ul>

              {currentPlan !== pkg.title ? (
                <button
                  onClick={() => alert(`Upgrade to ${pkg.title}`)}
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
          ))}
        </div>

      </OGDialogContent>
    </OGDialog>
  );
}