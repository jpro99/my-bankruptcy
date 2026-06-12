import { z } from "zod";
import { AddressSchema } from "../common.js";

export const VoluntaryPetitionSchema = z.object({
  formVersion: z.literal("101"),
  matterId: z.string().uuid(),
  chapter: z.enum(["7", "13"]),
  district: z.enum(["CACB", "CAEB", "CANB", "CASB"]),
  debtor1: z.object({
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    suffix: z.string().optional(),
    ssnLast4: z.string().regex(/^\d{4}$/),
    address: AddressSchema,
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  debtor2: z
    .object({
      firstName: z.string().min(1),
      middleName: z.string().optional(),
      lastName: z.string().min(1),
      suffix: z.string().optional(),
      ssnLast4: z.string().regex(/^\d{4}$/),
      address: AddressSchema,
    })
    .optional(),
  filingFee: z.enum(["pay_now", "installments", "fee_waiver"]),
  natureOfDebt: z.enum(["consumer", "business", "both"]),
});

export type VoluntaryPetition = z.infer<typeof VoluntaryPetitionSchema>;
