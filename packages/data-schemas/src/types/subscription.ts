import type { Document } from 'mongoose';

export interface ISubscription extends Document {
  title: string;
  description: string;
  price: number;
  feature?: string[];
}
