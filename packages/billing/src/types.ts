import { z } from "zod";

export const BillingChapterSchema = z.enum(["7", "13"]);
export type BillingChapter = z.infer<typeof BillingChapterSchema>;

export const FeePackageSchema = z.object({
  id: z.string(),
  chapter: BillingChapterSchema,
  label: z.string(),
  flatFee: z.string(),
  courtFilingFee: z.string(),
  creditReportFee: z.string(),
  counselingFee: z.string(),
  description: z.string(),
});

export type FeePackage = z.infer<typeof FeePackageSchema>;

export const InvoiceLineSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.string(),
  category: z.enum(["attorney", "court", "third_party", "trust"]),
  paid: z.boolean().default(false),
});

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

export const MatterInvoiceSchema = z.object({
  matterId: z.string(),
  chapter: BillingChapterSchema,
  packageId: z.string(),
  lines: z.array(InvoiceLineSchema),
  subtotal: z.string(),
  paidAmount: z.string(),
  balanceDue: z.string(),
  status: z.enum(["draft", "sent", "partial", "paid"]),
  trustBalance: z.string(),
  generatedAt: z.string().datetime(),
});

export type MatterInvoice = z.infer<typeof MatterInvoiceSchema>;

export interface GenerateInvoiceInput {
  matterId: string;
  chapter: BillingChapter;
  packageId?: string;
  paidAmount?: string;
  trustBalance?: string;
}
