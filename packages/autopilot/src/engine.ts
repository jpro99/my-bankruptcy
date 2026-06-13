import { randomUUID } from "node:crypto";
import type {
  AutopilotChapter,
  AutopilotTask,
  AutopilotTimeline,
  GenerateTimelineInput,
  TaskCategory,
  TaskPriority,
} from "./types.js";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  daysFromFiling: number;
  chapters: AutopilotChapter[];
  autoAction?: AutopilotTask["autoAction"];
}

const CH7_TEMPLATES: TaskTemplate[] = [
  {
    id: "auto-pay-stubs",
    title: "Collect post-petition pay stubs",
    description: "Debtor must provide pay advices for 60 days pre-petition and ongoing stubs per §521(a)(1)(B)(i).",
    category: "document",
    priority: "high",
    daysFromFiling: 14,
    chapters: ["7", "13"],
    autoAction: "draft_client_letter",
  },
  {
    id: "tax-returns",
    title: "Obtain tax returns (prior 2 years)",
    description: "Debtor must provide federal tax returns for year petition filed and prior year per §521(a)(1)(B)(ii).",
    category: "compliance",
    priority: "critical",
    daysFromFiling: 7,
    chapters: ["7", "13"],
    autoAction: "check_tax_returns",
  },
  {
    id: "341-prep",
    title: "Prepare client for §341 meeting",
    description: "Review SOFA, schedules, and likely trustee questions. Confirm ID and SS card.",
    category: "341_meeting",
    priority: "critical",
    daysFromFiling: 21,
    chapters: ["7", "13"],
    autoAction: "generate_341_prep",
  },
  {
    id: "341-meeting",
    title: "Attend §341 meeting of creditors",
    description: "Meeting typically scheduled 20–40 days after filing (Fed. R. Bankr. P. 2003).",
    category: "341_meeting",
    priority: "critical",
    daysFromFiling: 30,
    chapters: ["7", "13"],
  },
  {
    id: "financial-mgmt",
    title: "Debtor education course (post-filing)",
    description: "Complete approved personal financial management course before discharge (§727(a)(11)).",
    category: "compliance",
    priority: "high",
    daysFromFiling: 45,
    chapters: ["7"],
  },
  {
    id: "docket-monitor",
    title: "Monitor CM/ECF docket for trustee motions",
    description: "Watch for trustee reports, fee applications, and creditor objections.",
    category: "docket",
    priority: "normal",
    daysFromFiling: 3,
    chapters: ["7", "13"],
    autoAction: "monitor_docket",
  },
  {
    id: "reaffirmation-review",
    title: "Review reaffirmation agreements",
    description: "Evaluate secured vehicle/mortgage reaffirmations within 45 days of 341 meeting.",
    category: "document",
    priority: "normal",
    daysFromFiling: 60,
    chapters: ["7"],
  },
  {
    id: "discharge-track",
    title: "Track discharge eligibility",
    description: "Confirm no §727 objections filed; means test and credit counseling complete.",
    category: "deadline",
    priority: "high",
    daysFromFiling: 90,
    chapters: ["7"],
  },
];

const CH13_TEMPLATES: TaskTemplate[] = [
  {
    id: "first-plan-payment",
    title: "Confirm first plan payment received",
    description: "First Ch 13 payment due within 30 days of filing per §1326(a)(1)(A).",
    category: "plan_payment",
    priority: "critical",
    daysFromFiling: 30,
    chapters: ["13"],
    autoAction: "calculate_plan_payment",
  },
  {
    id: "plan-confirmation",
    title: "Plan confirmation hearing prep",
    description: "Prepare for confirmation hearing — best interest, feasibility, and good faith.",
    category: "deadline",
    priority: "critical",
    daysFromFiling: 45,
    chapters: ["13"],
  },
  {
    id: "annual-tax",
    title: "File annual tax returns during plan",
    description: "Debtor must file all required tax returns during Ch 13 case (§1308).",
    category: "compliance",
    priority: "high",
    daysFromFiling: 365,
    chapters: ["13"],
  },
];

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function resolveStatus(dueDate: string, today: string): AutopilotTask["status"] {
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "due";
  return "upcoming";
}

function buildTask(
  template: TaskTemplate,
  input: GenerateTimelineInput,
  today: string
): AutopilotTask {
  const dueDate =
    template.id === "341-meeting" && input.meeting341Date
      ? input.meeting341Date
      : addDays(input.filingDate, template.daysFromFiling);

  return {
    id: `${input.matterId}-${template.id}`,
    matterId: input.matterId,
    title: template.title,
    description: template.description,
    category: template.category,
    priority: template.priority,
    status: resolveStatus(dueDate, today),
    dueDate,
    daysFromFiling: template.daysFromFiling,
    autoAction: template.autoAction,
    metadata: { templateId: template.id },
  };
}

/** Generate post-petition autopilot timeline from filing date */
export function generateTimeline(input: GenerateTimelineInput): AutopilotTimeline {
  const today = new Date().toISOString().slice(0, 10);
  const templates = [...CH7_TEMPLATES, ...CH13_TEMPLATES].filter((t) =>
    t.chapters.includes(input.chapter)
  );

  const tasks = templates
    .map((t) => buildTask(t, input, today))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const summary = {
    total: tasks.length,
    due: tasks.filter((t) => t.status === "due").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    upcoming: tasks.filter((t) => t.status === "upcoming").length,
  };

  return {
    matterId: input.matterId,
    caseNumber: input.caseNumber,
    chapter: input.chapter,
    filingDate: input.filingDate,
    tasks,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

export function completeTask(
  timeline: AutopilotTimeline,
  taskId: string
): AutopilotTimeline {
  const tasks = timeline.tasks.map((t) =>
    t.id === taskId
      ? { ...t, status: "completed" as const, completedAt: new Date().toISOString() }
      : t
  );
  return refreshSummary({ ...timeline, tasks });
}

export function dismissTask(
  timeline: AutopilotTimeline,
  taskId: string
): AutopilotTimeline {
  const tasks = timeline.tasks.map((t) =>
    t.id === taskId ? { ...t, status: "dismissed" as const } : t
  );
  return refreshSummary({ ...timeline, tasks });
}

function refreshSummary(timeline: AutopilotTimeline): AutopilotTimeline {
  const tasks = timeline.tasks.filter((t) => t.status !== "dismissed");
  return {
    ...timeline,
    tasks,
    summary: {
      total: tasks.length,
      due: tasks.filter((t) => t.status === "due").length,
      overdue: tasks.filter((t) => t.status === "overdue").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      upcoming: tasks.filter((t) => t.status === "upcoming").length,
    },
  };
}

/** Auto-actions the worker can execute */
export function getAutoActionPayload(task: AutopilotTask): Record<string, unknown> | null {
  switch (task.autoAction) {
    case "generate_341_prep":
      return {
        type: "341_prep_packet",
        sections: [
          "Identity verification checklist",
          "SOFA high-risk questions",
          "Recent transfers review",
          "Tax refund expectation",
        ],
        generatedId: randomUUID(),
      };
    case "draft_client_letter":
      return {
        type: "client_letter",
        subject: "Documents needed for your bankruptcy case",
        body: "Please upload your last 60 days of pay stubs and prior-year tax returns via the client portal.",
      };
    case "monitor_docket":
      return {
        type: "docket_watch",
        lastChecked: new Date().toISOString(),
        newEntries: [],
      };
    case "calculate_plan_payment":
      return {
        type: "plan_payment_reminder",
        amountDue: "580.00",
        dueDate: task.dueDate,
      };
    case "check_tax_returns":
      return {
        type: "tax_compliance_check",
        yearsRequired: [new Date().getFullYear() - 1, new Date().getFullYear() - 2],
      };
    default:
      return null;
  }
}

export const AUTOPILOT_TASK_COUNT = CH7_TEMPLATES.length + CH13_TEMPLATES.length;
