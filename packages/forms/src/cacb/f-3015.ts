import { z } from "zod";
import { AddressSchema, MoneySchema } from "../common.js";

/** CACB F 3015-1.01 — Chapter 13 Plan (rev. Dec 1, 2025) */
export const CacbChapter13PlanSchema = z.object({
  formId: z.literal("F-3015-1.01"),
  formVersion: z.literal("2025-12-01"),
  matterId: z.string().uuid(),
  district: z.literal("CACB"),
  planLengthMonths: z.number().int().min(36).max(60),
  debtorNames: z.string().min(1),
  caseNumber: z.string().optional(),
  monthlyPlanPayment: MoneySchema,
  securedTreatment: z.array(
    z.object({
      creditorName: z.string(),
      monthlyPayment: MoneySchema,
      arrearageCure: MoneySchema.optional(),
      treatment: z.enum(["maintain", "cure_and_maintain", "surrender"]),
    })
  ),
  priorityTreatment: z.array(
    z.object({
      creditorName: z.string(),
      totalAmount: MoneySchema,
      monthlyPayment: MoneySchema,
    })
  ),
  unsecuredTreatment: z.object({
    monthlyPayment: MoneySchema,
    percentageDistribution: z.string().optional(),
  }),
  bestInterestTestPassed: z.boolean(),
  disposableIncome: MoneySchema,
});

export type CacbChapter13Plan = z.infer<typeof CacbChapter13PlanSchema>;

/** CACB F 3015-1.7 — RARA (Requirements for Assumption or Rejection Agreement) */
export const CacbRaraSchema = z.object({
  formId: z.literal("F-3015-1.7"),
  matterId: z.string().uuid(),
  contracts: z.array(
    z.object({
      counterpartyName: z.string(),
      description: z.string(),
      decision: z.enum(["assume", "reject"]),
      cureAmount: MoneySchema.optional(),
    })
  ),
});

export type CacbRara = z.infer<typeof CacbRaraSchema>;

/** CACB 341(a) Meeting Notice */
export const Cacb341NoticeSchema = z.object({
  formId: z.literal("341-NOTICE"),
  matterId: z.string().uuid(),
  meetingDate: z.string().datetime(),
  meetingLocation: z.string(),
  meetingAddress: AddressSchema,
  trusteeName: z.string(),
  debtorNames: z.string(),
  caseNumber: z.string().optional(),
});

export type Cacb341Notice = z.infer<typeof Cacb341NoticeSchema>;

/** CACB Master Mailing List */
export const CacbMasterMailingListSchema = z.object({
  formId: z.literal("MASTER-MAILING-LIST"),
  matterId: z.string().uuid(),
  entries: z.array(
    z.object({
      name: z.string(),
      address: AddressSchema,
      role: z.enum(["debtor", "creditor", "trustee", "attorney", "other"]),
      scheduleReference: z.string().optional(),
    })
  ),
});

export type CacbMasterMailingList = z.infer<typeof CacbMasterMailingListSchema>;
