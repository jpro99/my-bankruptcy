import { z } from "zod";

export const PetitionFieldStatusSchema = z.enum([
  "approved",
  "pending",
  "edited",
  "questioned",
  "computed",
  "imported",
]);
export type PetitionFieldStatus = z.infer<typeof PetitionFieldStatusSchema>;

export const ValuationTierSchema = z.enum(["low", "medium", "high"]);
export type ValuationTier = z.infer<typeof ValuationTierSchema>;

export const ValuationProvenanceSchema = z.object({
  tier: ValuationTierSchema,
  selectedAmount: z.string(),
  lowAmount: z.string().optional(),
  mediumAmount: z.string().optional(),
  highAmount: z.string().optional(),
  sourceName: z.string(),
  sourceUrl: z.string().optional(),
  lookupDate: z.string(),
  method: z.string().optional(),
  snapshotLines: z.array(z.string()).optional(),
});

export type ValuationProvenance = z.infer<typeof ValuationProvenanceSchema>;

export const PetitionLineItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  status: PetitionFieldStatusSchema,
  confidence: z.number().min(0).max(1).optional(),
  sourceDocument: z.string().optional(),
  formReference: z.string().optional(),
  valuation: ValuationProvenanceSchema.optional(),
  isManual: z.boolean().optional(),
  scheduleBucket: z.enum(["D", "E", "F", "G"]).optional(),
});

export type PetitionLineItem = z.infer<typeof PetitionLineItemSchema>;

export const PetitionScheduleSchema = z.object({
  id: z.string(),
  formId: z.string(),
  title: z.string(),
  description: z.string(),
  items: z.array(PetitionLineItemSchema),
  completionPercent: z.number().int().min(0).max(100),
  itemCount: z.number().int(),
  approvedCount: z.number().int(),
});

export type PetitionSchedule = z.infer<typeof PetitionScheduleSchema>;

export const PetitionViewSchema = z.object({
  matterId: z.string(),
  district: z.string(),
  division: z.string().optional(),
  county: z.string(),
  chapter: z.enum(["7", "13"]),
  debtorName: z.string(),
  schedules: z.array(PetitionScheduleSchema),
  totalFields: z.number().int(),
  approvedFields: z.number().int(),
  overallCompletion: z.number().int().min(0).max(100),
  assembledAt: z.string().datetime(),
});

export type PetitionView = z.infer<typeof PetitionViewSchema>;

export interface ReviewFieldInput {
  id: string;
  fieldPath: string;
  formId: string;
  proposedValue: unknown;
  approvalState: "pending" | "approved" | "edited" | "questioned";
  confidence: number;
  sourceDocument?: { fileName: string };
}

export interface TradelineInput {
  id: string;
  creditorName: string;
  schedule: "D" | "E" | "F" | "G";
  balance: string;
  monthlyPayment?: string;
  confidence: number;
  collateralDescription?: string;
  approvalState?: "pending" | "approved" | "edited";
  isManual?: boolean;
}

export interface AssetInput {
  id: string;
  description: string;
  category: string;
  currentValue: string;
  securedAmount?: string;
  exemptionSystem?: string;
  exemptionAmount?: string;
  valuation?: ValuationProvenance;
}

export interface AssemblePetitionInput {
  matterId: string;
  district: string;
  division?: string;
  county: string;
  chapter: "7" | "13";
  debtorDisplayName: string;
  reviewFields: ReviewFieldInput[];
  tradelines: TradelineInput[];
  assets: AssetInput[];
}

function fieldStatus(
  approvalState: ReviewFieldInput["approvalState"]
): PetitionFieldStatus {
  if (approvalState === "approved") return "approved";
  if (approvalState === "edited") return "edited";
  if (approvalState === "questioned") return "questioned";
  return "pending";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function scheduleCompletion(items: PetitionLineItem[]): {
  completionPercent: number;
  approvedCount: number;
} {
  if (items.length === 0) return { completionPercent: 0, approvedCount: 0 };
  const approved = items.filter(
    (i) => i.status === "approved" || i.status === "edited" || i.status === "computed" || i.status === "imported"
  ).length;
  return {
    completionPercent: Math.round((approved / items.length) * 100),
    approvedCount: approved,
  };
}

function buildSchedule(
  id: string,
  formId: string,
  title: string,
  description: string,
  items: PetitionLineItem[]
): PetitionSchedule {
  const { completionPercent, approvedCount } = scheduleCompletion(items);
  return {
    id,
    formId,
    title,
    description,
    items,
    completionPercent,
    itemCount: items.length,
    approvedCount,
  };
}

/** Assemble a read-only petition view from matter data — schedules A/B through J */
export function assemblePetition(input: AssemblePetitionInput): PetitionView {
  const debtorFields = input.reviewFields.filter((f) => f.formId === "101");
  const incomeFields = input.reviewFields.filter((f) => f.formId === "106I");
  const expenseFields = input.reviewFields.filter((f) => f.formId === "106J");

  const form101 = buildSchedule(
    "petition",
    "101",
    "Voluntary Petition",
    "Debtor identification and chapter election",
    [
      ...debtorFields.map((f) => ({
        id: f.id,
        label: f.fieldPath,
        value: formatValue(f.proposedValue),
        status: fieldStatus(f.approvalState),
        confidence: f.confidence,
        sourceDocument: f.sourceDocument?.fileName,
        formReference: "101",
      })),
      {
        id: "chapter-election",
        label: "Chapter",
        value: `Chapter ${input.chapter}`,
        status: "computed" as const,
        formReference: "101",
      },
      {
        id: "district-filing",
        label: "Filing district",
        value: `${input.district}${input.division ? ` · ${input.division}` : ""} · ${input.county} County`,
        status: "computed" as const,
      },
    ]
  );

  const scheduleAB = buildSchedule(
    "schedule-ab",
    "106A/B",
    "Schedule A/B — Property",
    "Real and personal property",
    input.assets.map((a) => ({
      id: a.id,
      label: a.description,
      value: `$${a.currentValue}${a.securedAmount ? ` (secured: $${a.securedAmount})` : ""}`,
      status: "computed" as const,
      formReference: "106A/B",
      valuation: a.valuation,
    }))
  );

  const scheduleC = buildSchedule(
    "schedule-c",
    "106C",
    "Schedule C — Exemptions",
    "Property claimed as exempt",
    input.assets.map((a) => ({
      id: `ex-${a.id}`,
      label: a.description,
      value: a.exemptionAmount
        ? `$${a.exemptionAmount} (${a.exemptionSystem ?? "System 2"})`
        : "Not claimed",
      status: a.exemptionAmount ? ("computed" as const) : ("pending" as const),
      formReference: "106C",
    }))
  );

  const bySchedule = (bucket: "D" | "E" | "F" | "G") =>
    input.tradelines.filter((t) => t.schedule === bucket);

  const scheduleD = buildSchedule(
    "schedule-d",
    "106D",
    "Schedule D — Secured Creditors",
    "Creditors with claims secured by property",
    bySchedule("D").map((t) => ({
      id: t.id,
      label: `${t.isManual ? "[Not on credit] " : ""}${t.creditorName}`,
      value: `$${t.balance}${t.monthlyPayment ? ` · $${t.monthlyPayment}/mo` : ""}${t.collateralDescription ? ` · ${t.collateralDescription}` : ""}`,
      status: t.approvalState ? fieldStatus(t.approvalState) : ("imported" as const),
      confidence: t.confidence,
      formReference: "106D",
      isManual: t.isManual,
      scheduleBucket: "D" as const,
    }))
  );

  const scheduleEF = buildSchedule(
    "schedule-ef",
    "106E/F",
    "Schedule E/F — Unsecured Creditors",
    "Priority and nonpriority unsecured claims",
    [...bySchedule("E"), ...bySchedule("F")].map((t) => ({
      id: t.id,
      label: `${t.isManual ? "[Not on credit] " : ""}${t.schedule === "E" ? "[Priority] " : ""}${t.creditorName}`,
      value: `$${t.balance}`,
      status: t.approvalState ? fieldStatus(t.approvalState) : ("imported" as const),
      confidence: t.confidence,
      formReference: "106E/F",
      isManual: t.isManual,
      scheduleBucket: t.schedule,
    }))
  );

  const scheduleG = buildSchedule(
    "schedule-g",
    "106G",
    "Schedule G — Executory Contracts",
    "Unexpired leases and executory contracts",
    bySchedule("G").map((t) => ({
      id: t.id,
      label: `${t.isManual ? "[Not on credit] " : ""}${t.creditorName}`,
      value: `$${t.balance}/mo`,
      status: "imported" as const,
      confidence: t.confidence,
      formReference: "106G",
      isManual: t.isManual,
      scheduleBucket: "G" as const,
    }))
  );

  const scheduleI = buildSchedule(
    "schedule-i",
    "106I",
    "Schedule I — Income",
    "Current income of individual debtor(s)",
    incomeFields.length > 0
      ? incomeFields.map((f) => ({
          id: f.id,
          label: f.fieldPath,
          value: formatValue(f.proposedValue),
          status: fieldStatus(f.approvalState),
          confidence: f.confidence,
          sourceDocument: f.sourceDocument?.fileName,
          formReference: "106I",
        }))
      : [
          {
            id: "placeholder-i",
            label: "Monthly income",
            value: "Pending intake",
            status: "pending" as const,
            formReference: "106I",
          },
        ]
  );

  const scheduleJ = buildSchedule(
    "schedule-j",
    "106J",
    "Schedule J — Expenses",
    "Current expenditures",
    expenseFields.length > 0
      ? expenseFields.map((f) => ({
          id: f.id,
          label: f.fieldPath,
          value: formatValue(f.proposedValue),
          status: fieldStatus(f.approvalState),
          confidence: f.confidence,
          sourceDocument: f.sourceDocument?.fileName,
          formReference: "106J",
        }))
      : [
          {
            id: "placeholder-j",
            label: "Monthly expenses",
            value: "Pending intake",
            status: "pending" as const,
            formReference: "106J",
          },
        ]
  );

  const meansTestForm = input.chapter === "13" ? "122C" : "122A";
  const meansTest = buildSchedule(
    "means-test",
    meansTestForm,
    `Form ${meansTestForm} — Means Test`,
    "Chapter-specific means test analysis",
    [
      {
        id: "means-computed",
        label: "Means test status",
        value: "Computed by legal engine",
        status: "computed" as const,
        formReference: meansTestForm,
      },
    ]
  );

  const schedules = [
    form101,
    scheduleAB,
    scheduleC,
    scheduleD,
    scheduleEF,
    scheduleG,
    buildSchedule(
      "schedule-h",
      "106H",
      "Schedule H — Codebtors",
      "Non-filing spouses, guarantors, and other codebtors",
      [
        {
          id: "placeholder-h",
          label: "Codebtors",
          value: input.reviewFields.some((f) => f.fieldPath.includes("codebtor"))
            ? "See intake"
            : "None identified",
          status: "pending" as const,
          formReference: "106H",
        },
      ]
    ),
    scheduleI,
    scheduleJ,
    meansTest,
  ];

  const allItems = schedules.flatMap((s) => s.items);
  const approvedFields = allItems.filter(
    (i) =>
      i.status === "approved" ||
      i.status === "edited" ||
      i.status === "computed" ||
      i.status === "imported"
  ).length;

  return {
    matterId: input.matterId,
    district: input.district,
    division: input.division,
    county: input.county,
    chapter: input.chapter,
    debtorName: input.debtorDisplayName,
    schedules,
    totalFields: allItems.length,
    approvedFields,
    overallCompletion:
      allItems.length > 0 ? Math.round((approvedFields / allItems.length) * 100) : 0,
    assembledAt: new Date().toISOString(),
  };
}
