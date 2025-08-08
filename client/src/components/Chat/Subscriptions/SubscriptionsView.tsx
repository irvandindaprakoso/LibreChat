import React, { useEffect, useState } from 'react';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
} from '@librechat/client';

const subscriptionPackages = [
  {
    name: 'Plus',
    price: 10,
    features: [
        'Smarter models',
        'Expanded messaging and uploads',
        'Expanded and faster image creation',
        'Expanded deep research and agent mode',
        'Expanded memory and context',
        'Projects, tasks and custom GPTs',
        'Sora video generation',
        'Codex agent',
    ],
    description: "More access to advanced intelligence"
  },
];

export default function Subscriptions({ open, onOpenChange }) {
  const [currentPlan, setCurrentPlan] = useState('Basic');

  useEffect(() => {
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
              key={pkg.name}
              className={`rounded-lg border p-6 flex flex-col items-center text-center w-full max-w-sm ${
                currentPlan === pkg.name
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-border-primary'
              }`}
            >
              <h3 className="text-lg font-bold text-token-text-primary">{pkg.name}</h3>
              <p className="text-sm text-token-text-secondary mb-2">${pkg.price}/month</p>
              
              <ul className="mb-4 text-sm text-token-text-secondary text-left list-disc list-inside w-full">
                {pkg.features.map((feat, i) => (
                    <li key={i} className="leading-loose">{feat}</li>
                ))}
              </ul>

              {currentPlan !== pkg.name ? (
                <button
                  onClick={() => alert(`Upgrade to ${pkg.name}`)}
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
