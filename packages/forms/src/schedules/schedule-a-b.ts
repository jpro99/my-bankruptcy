import { z } from "zod";
import { AddressSchema, MoneySchema } from "../common.js";

export const ScheduleABPropertySchema = z.object({
  propertyNumber: z.number().int().positive(),
  description: z.string().min(1).max(2000),
  natureOfInterest: z.string().max(500).optional(),
  communityProperty: z.boolean().default(false),
  currentValue: MoneySchema,
  securedClaimAmount: MoneySchema.optional(),
  sourceDocumentId: z.string().uuid().optional(),
});

export type ScheduleABProperty = z.infer<typeof ScheduleABPropertySchema>;

export const ScheduleABSchema = z.object({
  formVersion: z.literal("106A/B"),
  matterId: z.string().uuid(),
  realProperty: z.array(ScheduleABPropertySchema),
  personalProperty: z.array(ScheduleABPropertySchema),
});

export type ScheduleAB = z.infer<typeof ScheduleABSchema>;
