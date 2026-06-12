import { z } from "zod";
import { AddressSchema, MoneySchema } from "../common.js";

export const ScheduleGContractSchema = z.object({
  contractNumber: z.number().int().positive(),
  counterpartyName: z.string().min(1).max(500),
  counterpartyAddress: AddressSchema.optional(),
  description: z.string().min(1).max(2000),
  monthlyPayment: MoneySchema.optional(),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assumeOrReject: z.enum(["assume", "reject", "unexpired_lease"]).optional(),
  sourceTradelineId: z.string().optional(),
});

export type ScheduleGContract = z.infer<typeof ScheduleGContractSchema>;

export const ScheduleGSchema = z.object({
  formVersion: z.literal("106G"),
  matterId: z.string().uuid(),
  contracts: z.array(ScheduleGContractSchema),
});

export type ScheduleG = z.infer<typeof ScheduleGSchema>;
