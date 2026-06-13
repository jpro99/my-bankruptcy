import { z } from "zod";

export const GuideChapterSchema = z.enum(["7", "13"]);
export type GuideChapter = z.infer<typeof GuideChapterSchema>;

export const GuideStepStatusSchema = z.enum([
  "complete",
  "in_progress",
  "blocked",
  "pending",
  "skipped",
]);
export type GuideStepStatus = z.infer<typeof GuideStepStatusSchema>;

export const GuideStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: GuideStepStatusSchema,
  /** 0–100 weight toward overall completion */
  weight: z.number().int().positive(),
  actionLabel: z.string().optional(),
  actionHref: z.string().optional(),
  estimatedMinutes: z.number().int().optional(),
});

export type GuideStep = z.infer<typeof GuideStepSchema>;

export const MatterProgressSchema = z.object({
  matterId: z.string(),
  chapter: GuideChapterSchema,
  debtorDisplayName: z.string(),
  overallPercent: z.number().int().min(0).max(100),
  stepsComplete: z.number().int(),
  stepsTotal: z.number().int(),
  steps: z.array(GuideStepSchema),
  nextAction: z.object({
    stepId: z.string(),
    title: z.string(),
    href: z.string(),
    label: z.string(),
  }).optional(),
  readyToFile: z.boolean(),
  tagline: z.string(),
});

export type MatterProgress = z.infer<typeof MatterProgressSchema>;

export interface ComputeProgressInput {
  matterId: string;
  chapter: GuideChapter;
  debtorDisplayName: string;
  /** Intake documents uploaded */
  intakeComplete: boolean;
  /** All fields approved */
  reviewComplete: boolean;
  pendingFieldCount: number;
  creditPulled: boolean;
  preflightReady: boolean;
  filed: boolean;
  autopilotActive: boolean;
  clientPortalRequestsOpen: number;
  balanceDue: string;
  /** Petition schedules assembled (0–100) */
  petitionCompletionPercent?: number;
  /** District configured for filing */
  districtConfigured?: boolean;
  /** BAPCPA Course 1 complete */
  counselingComplete?: boolean;
}
