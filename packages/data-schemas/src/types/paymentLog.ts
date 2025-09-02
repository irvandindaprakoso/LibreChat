import { Document, Types } from 'mongoose';

export interface IPaymentLog extends Document {
  user?: Types.ObjectId;
  stripeEventId: string;
  eventType: string;
  payload: any;
  receivedAt: Date;
}