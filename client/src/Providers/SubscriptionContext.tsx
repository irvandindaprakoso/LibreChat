import { createContext, useContext } from 'react';
import type { TSubscription } from 'librechat-data-provider';

type TSubscriptionContext = { subscription: TSubscription | null };

export const SubscriptionContext = createContext<TSubscriptionContext>({
  subscription: null,
});
export const useSubscriptionContext = () => useContext(SubscriptionContext);
