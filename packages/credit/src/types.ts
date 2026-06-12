import { z } from "zod";

export const CreditTradelineSchema = z.object({
  id: z.string(),
  creditorName: z.string(),
  accountNumberLast4: z.string().optional(),
  accountType: z.string(),
  balance: z.string(),
  monthlyPayment: z.string().optional(),
  dateOpened: z.string().optional(),
  collateralDescription: z.string().optional(),
  isSecured: z.boolean().optional(),
  isRevolving: z.boolean().optional(),
  isLease: z.boolean().optional(),
  isPriority: z.boolean().optional(),
  priorityClass: z
    .enum([
      "domestic_support",
      "taxes",
      "wages_salaries_commissions",
      "contributions_to_employee_benefit_plans",
      "other",
    ])
    .optional(),
  status: z.string().optional(),
});

export type CreditTradeline = z.infer<typeof CreditTradelineSchema>;

export const CreditPullRequestSchema = z.object({
  matterId: z.string().uuid(),
  firmId: z.string().uuid(),
  debtorFirstName: z.string(),
  debtorLastName: z.string(),
  ssnLast4: z.string().regex(/^\d{4}$/),
  consentTimestamp: z.string().datetime(),
});

export type CreditPullRequest = z.infer<typeof CreditPullRequestSchema>;

export const CreditPullResultSchema = z.object({
  pullId: z.string().uuid(),
  matterId: z.string().uuid(),
  bureau: z.enum(["tri_merge", "experian", "equifax", "transunion"]),
  tradelines: z.array(CreditTradelineSchema),
  pulledAt: z.string().datetime(),
  provider: z.string(),
});

export type CreditPullResult = z.infer<typeof CreditPullResultSchema>;

export interface CreditPullProvider {
  readonly name: string;
  pullTriMerge(request: CreditPullRequest): Promise<CreditPullResult>;
}
