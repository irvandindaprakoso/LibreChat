import { Schema} from 'mongoose';
import type { IInvoice } from '~/types';

const invoiceSchema = new Schema<IInvoice>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  stripeInvoiceId: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  issuedAt: { type: Date, default: Date.now },
  paidAt: Date,
}, { timestamps: true });

export default invoiceSchema;