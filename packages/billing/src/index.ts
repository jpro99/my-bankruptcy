export { generateInvoice, recordPayment, getFeePackages, getFeePackage, FEE_PACKAGES } from "./fees.js";
export type {
  BillingChapter,
  FeePackage,
  GenerateInvoiceInput,
  InvoiceLine,
  MatterInvoice,
} from "./types.js";
export { MatterInvoiceSchema, FeePackageSchema } from "./types.js";
