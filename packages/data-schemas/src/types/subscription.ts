import type { Document } from 'mongoose';

export interface ISubscription extends Document {
  title: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripeProductId: { type: String }, // ID product di Stripe
  stripePriceIdMonthly: { type: String }, // price_xxx
  stripePriceIdYearly: { type: String }, // price_xxx
  feature?: string[];
}
