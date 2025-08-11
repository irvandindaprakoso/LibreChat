import type { Document } from 'mongoose';

export interface ISubscription extends Document {
  title: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  feature?: string[];
}
