import paymentLogSchema from '~/schema/paymentLog';
import type { IPaymentLog } from '~/types';

/**
 * Creates or returns the PaymentLog model using the provided mongoose instance and schema
 */
export function createPaymentLogModel(mongoose: typeof import('mongoose')) {
  return (
    mongoose.models.PaymentLog || mongoose.model<IPaymentLog>('PaymentLog', paymentLogSchema)
  );
}