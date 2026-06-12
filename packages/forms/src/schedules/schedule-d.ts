import { z } from "zod";
import { AddressSchema, MoneySchema } from "../common.js";

export const ScheduleDCreditorSchema = z.object({
  creditorNumber: z.number().int().positive(),
  creditorName: z.string().min(1).max(500),
  creditorAddress: AddressSchema,
  accountNumberLast4: z.string().regex(/^\d{4}$/).optional(),
  collateralDescription: z.string().max(2000),
  claimAmount: MoneySchema,
  arrearageAmount: MoneySchema.optional(),
  contingent: z.boolean().default(false),
  unliquidated: z.boolean().default(false),
  disputed: z.boolean().default(false),
  sourceTradelineId: z.string().optional(),
});

export type ScheduleDCreditor = z.infer<typeof ScheduleDCreditorSchema>;

export const ScheduleDSchema = z.object({
  formVersion: z.literal("106D"),
  matterId: z.string().uuid(),
  creditors: z.array(ScheduleDCreditorSchema),
  totalSecuredClaims: MoneySchema.optional(),
});

export type ScheduleD = z.infer<typeof ScheduleDSchema>;
