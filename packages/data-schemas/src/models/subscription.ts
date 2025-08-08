import subscriptionSchema from '~/schema/subscription';
import type { ISubscription } from '~/types';

/**
 * Creates or returns the Subscription model using the provided mongoose instance and schema
 */
export function createSubscriptionModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', subscriptionSchema);
}
