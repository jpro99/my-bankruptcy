import { z } from "zod";

/** Monetary values as decimal strings — never float */
export const MoneySchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, "Must be a valid decimal amount")
  .refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Amount must be non-negative");

export type Money = z.infer<typeof MoneySchema>;

export const AddressSchema = z.object({
  street1: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default("US"),
});

export type Address = z.infer<typeof AddressSchema>;

export const ApprovalStateSchema = z.enum([
  "pending",
  "approved",
  "edited",
  "questioned",
]);

export type ApprovalState = z.infer<typeof ApprovalStateSchema>;

export const ConfidenceSchema = z.number().min(0).max(1);

export type Confidence = z.infer<typeof ConfidenceSchema>;
