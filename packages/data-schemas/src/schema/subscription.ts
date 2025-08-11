import { Schema } from 'mongoose';
import type { ISubscription } from '~/types';

const subscriptionSchema = new Schema<ISubscription>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
    },
    priceYearly: {
      type: Number,
      required: true,
    },
    feature: {
      type: Array,
    },
  },
  { timestamps: true },
);

export default subscriptionSchema;
