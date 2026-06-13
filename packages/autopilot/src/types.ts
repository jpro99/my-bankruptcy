import { z } from "zod";

export const AutopilotChapterSchema = z.enum(["7", "13"]);
export type AutopilotChapter = z.infer<typeof AutopilotChapterSchema>;

export const TaskStatusSchema = z.enum([
  "upcoming",
  "due",
  "overdue",
  "completed",
  "dismissed",
  "blocked",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["critical", "high", "normal", "low"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskCategorySchema = z.enum([
  "341_meeting",
  "deadline",
  "document",
  "client_communication",
  "trustee",
  "plan_payment",
  "compliance",
  "docket",
]);
export type TaskCategory = z.infer<typeof TaskCategorySchema>;

export const AutopilotTaskSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  title: z.string(),
  description: z.string(),
  category: TaskCategorySchema,
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  dueDate: z.string().date(),
  /** Statutory or rule-based offset from filing date (days) */
  daysFromFiling: z.number().int().optional(),
  /** Auto-generated action the system can perform */
  autoAction: z
    .enum([
      "generate_341_prep",
      "draft_client_letter",
      "monitor_docket",
      "calculate_plan_payment",
      "check_tax_returns",
      "none",
    ])
    .optional(),
  completedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AutopilotTask = z.infer<typeof AutopilotTaskSchema>;

export const AutopilotTimelineSchema = z.object({
  matterId: z.string(),
  caseNumber: z.string(),
  chapter: AutopilotChapterSchema,
  filingDate: z.string().date(),
  tasks: z.array(AutopilotTaskSchema),
  summary: z.object({
    total: z.number().int(),
    due: z.number().int(),
    overdue: z.number().int(),
    completed: z.number().int(),
    upcoming: z.number().int(),
  }),
  generatedAt: z.string().datetime(),
});

export type AutopilotTimeline = z.infer<typeof AutopilotTimelineSchema>;

export interface GenerateTimelineInput {
  matterId: string;
  caseNumber: string;
  chapter: AutopilotChapter;
  filingDate: string;
  /** Optional 341 meeting date if already set by trustee */
  meeting341Date?: string;
}

export interface TaskUpdateInput {
  taskId: string;
  status: TaskStatus;
  completedAt?: string;
}
