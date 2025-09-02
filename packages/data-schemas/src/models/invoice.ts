import invoiceSchema from '~/schema/invoice';
import type { IInvoice } from '~/types';

/**
 * Creates or returns the Invoice model using the provided mongoose instance and schema
 */
export function createInvoiceModel(mongoose: typeof import('mongoose')) {
  return (
    mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema)
  );
}