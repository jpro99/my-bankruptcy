import { z } from "zod";
import { AddressSchema, MoneySchema } from "../common.js";

/** Priority classes per Official Form 106E instructions */
export const PriorityClassSchema = z.enum([
  "domestic_support",
  "taxes",
  "wages_salaries_commissions",
  "contributions_to_employee_benefit_plans",
  "other",
]);

export type PriorityClass = z.infer<typeof PriorityClassSchema>;

/** Schedule E/F — Unsecured Creditors (Official Form 106E/F) */
export const ScheduleEFCreditorSchema = z.object({
  creditorNumber: z.number().int().positive(),
  creditorName: z.string().min(1).max(500),
  creditorAddress: AddressSchema,
  accountNumberLast4: z
    .string()
    .regex(/^\d{4}$/, "Must be last 4 digits")
    .optional(),
  claimType: z.enum(["priority_unsecured", "nonpriority_unsecured"]),
  priorityClass: PriorityClassSchema.optional(),
  priorityAmount: MoneySchema.optional(),
  totalClaimAmount: MoneySchema,
  contingent: z.boolean().default(false),
  unliquidated: z.boolean().default(false),
  disputed: z.boolean().default(false),
  dateIncurred: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date YYYY-MM-DD")
    .optional(),
  consideration: z.string().max(2000).optional(),
  communityProperty: z.boolean().default(false),
  sourceDocumentId: z.string().uuid().optional(),
  sourceTradelineId: z.string().optional(),
  aiClassification: z
    .object({
      confidence: z.number().min(0).max(1),
      rationale: z.string(),
      scheduleRecommendation: z.enum(["E", "F"]),
    })
    .optional(),
});

export type ScheduleEFCreditor = z.infer<typeof ScheduleEFCreditorSchema>;

export const ScheduleEFSchema = z.object({
  formVersion: z.literal("106E/F"),
  matterId: z.string().uuid(),
  creditors: z.array(ScheduleEFCreditorSchema),
  totalPriorityClaims: MoneySchema.optional(),
  totalNonpriorityClaims: MoneySchema.optional(),
});

export type ScheduleEF = z.infer<typeof ScheduleEFSchema>;

/** Classify a tradeline into Schedule E or F */
export function classifyTradelineToScheduleEF(input: {
  isPriority: boolean;
  priorityClass?: PriorityClass;
}): {
  claimType: "priority_unsecured" | "nonpriority_unsecured";
  priorityClass?: PriorityClass;
  scheduleRecommendation: "E" | "F";
} {
  if (input.isPriority && input.priorityClass) {
    return {
      claimType: "priority_unsecured",
      priorityClass: input.priorityClass,
      scheduleRecommendation: "E",
    };
  }
  return {
    claimType: "nonpriority_unsecured",
    scheduleRecommendation: "F",
  };
}

export function computeScheduleEFTotals(creditors: ScheduleEFCreditor[]): {
  totalPriority: string;
  totalNonpriority: string;
} {
  let priority = 0;
  let nonpriority = 0;

  for (const c of creditors) {
    const amount = parseFloat(c.totalClaimAmount);
    if (c.claimType === "priority_unsecured") {
      priority += amount;
    } else {
      nonpriority += amount;
    }
  }

  return {
    totalPriority: priority.toFixed(2),
    totalNonpriority: nonpriority.toFixed(2),
  };
}
