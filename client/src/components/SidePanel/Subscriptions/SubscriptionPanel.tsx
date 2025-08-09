import { useGetSubscription } from '~/data-provider';
import { SubscriptionContext } from '~/Providers/SubscriptionContext';
import SubscriptionTable from './SubscriptionTable';

const SubscriptionPanel = () => {
  const { data } = useGetSubscription();
  return (
    <div className="h-auto max-w-full overflow-x-hidden">
      <SubscriptionContext.Provider value={{ subscription: data || null }}>
        <SubscriptionTable />
      </SubscriptionContext.Provider>
    </div>
  );
};
export default SubscriptionPanel;
