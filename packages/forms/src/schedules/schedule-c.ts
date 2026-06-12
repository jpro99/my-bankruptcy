import { z } from "zod";
import { MoneySchema } from "../common.js";

export const ExemptionClaimSchema = z.object({
  exemptionNumber: z.number().int().positive(),
  propertyDescription: z.string().min(1).max(2000),
  statute: z.string().min(1).max(200),
  currentValue: MoneySchema,
  exemptAmount: MoneySchema,
  nonexemptAmount: MoneySchema.optional(),
  exemptionSystem: z.enum(["system1", "system2"]),
});

export type ExemptionClaim = z.infer<typeof ExemptionClaimSchema>;

export const ScheduleCSchema = z.object({
  formVersion: z.literal("106C"),
  matterId: z.string().uuid(),
  exemptionSystemUsed: z.enum(["system1", "system2"]),
  claims: z.array(ExemptionClaimSchema),
  totalExempt: MoneySchema,
  totalNonexempt: MoneySchema.optional(),
});

export type ScheduleC = z.infer<typeof ScheduleCSchema>;

/** California 2025/2026 homestead exemption amounts (indexed annually) */
export const CA_HOMESTEAD_FLOOR = "361076.00";
export const CA_HOMESTEAD_CAP = "722507.00";
