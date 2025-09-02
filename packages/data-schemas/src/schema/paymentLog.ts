import { Schema } from 'mongoose';
import type { IPaymentLog } from '~/types';

const paymentLogSchema = new Schema<IPaymentLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  stripeEventId: { type: String, index: true },
  eventType: String,
  payload: Object,
  receivedAt: { type: Date, default: Date.now }
});

export default paymentLogSchema;