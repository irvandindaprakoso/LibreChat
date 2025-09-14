import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import store from '~/store';

export interface SubscriptionCheckResult {
  canSubmit: boolean;
  reason?: string;
  subscriptionStatus?: string;
  plan?: string;
  expiresAt?: Date | null;
}

export default function useSubscriptionCheck() {
  const user = useRecoilValue(store.user);

  const checkSubscription = useCallback((): SubscriptionCheckResult => {
    // If no user, allow submission (will be handled by auth)
    if (!user) {
      return { canSubmit: true };
    }

    // If no subscription, allow submission (free user)
    if (!user.subscription) {
      return { canSubmit: true };
    }

    const { status, plan, expiresAt } = user.subscription;

    // Check if subscription is active
    if (status === 'active') {
      // Check if subscription has expired
      if (expiresAt && new Date(expiresAt) < new Date()) {
        return {
          canSubmit: false,
          reason: 'Your subscription has expired. Please renew to continue using the service.',
          subscriptionStatus: status,
          plan,
          expiresAt: new Date(expiresAt)
        };
      }
      
      // Check if it's a trial subscription
      if (user.subscription?.isTrial) {
        const daysLeft = Math.ceil((new Date(expiresAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) {
          return {
            canSubmit: false,
            reason: 'Your free trial has expired. Please upgrade to continue using the service.',
            subscriptionStatus: status,
            plan,
            expiresAt: expiresAt ? new Date(expiresAt) : null
          };
        }
        
        // Trial is still active
        return {
          canSubmit: true,
          subscriptionStatus: status,
          plan,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        };
      }
      
      // Regular subscription is active and not expired
      return {
        canSubmit: true,
        subscriptionStatus: status,
        plan,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };
    }

    // Check other subscription statuses
    if (status === 'inactive') {
      return {
        canSubmit: false,
        reason: 'Your subscription is inactive. Please activate your subscription to continue.',
        subscriptionStatus: status,
        plan,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };
    }

    if (status === 'cancelled') {
      return {
        canSubmit: false,
        reason: 'Your subscription has been cancelled. Please reactivate to continue using the service.',
        subscriptionStatus: status,
        plan,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };
    }

    if (status === 'expired') {
      return {
        canSubmit: false,
        reason: 'Your subscription has expired. Please renew to continue using the service.',
        subscriptionStatus: status,
        plan,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      };
    }

    // Default: allow submission for unknown statuses
    return { canSubmit: true };
  }, [user]);

  return { checkSubscription };
}
