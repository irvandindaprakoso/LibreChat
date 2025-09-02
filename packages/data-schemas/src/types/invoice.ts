import type { Document, Types } from 'mongoose';

export interface IInvoice extends Document {
    user: Types.ObjectId;
    transaction: Types.ObjectId;
    invoiceNumber: string;
    stripeInvoiceId?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    issuedAt: Date;
    paidAt?: Date;
  }