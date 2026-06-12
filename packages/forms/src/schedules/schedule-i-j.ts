import { z } from "zod";
import { MoneySchema } from "../common.js";

export const ScheduleISchema = z.object({
  formVersion: z.literal("106I"),
  matterId: z.string().uuid(),
  debtor1MonthlyIncome: MoneySchema,
  debtor2MonthlyIncome: MoneySchema.optional(),
  otherIncome: MoneySchema.optional(),
  totalMonthlyIncome: MoneySchema,
});

export type ScheduleI = z.infer<typeof ScheduleISchema>;

export const ScheduleJSchema = z.object({
  formVersion: z.literal("106J"),
  matterId: z.string().uuid(),
  housing: MoneySchema,
  utilities: MoneySchema,
  food: MoneySchema,
  transportation: MoneySchema,
  insurance: MoneySchema,
  taxes: MoneySchema.optional(),
  otherExpenses: MoneySchema.optional(),
  totalMonthlyExpenses: MoneySchema,
});

export type ScheduleJ = z.infer<typeof ScheduleJSchema>;
