import type { MatterDiagnosticsPayload } from "@chapterai/means-test";
import {
  evaluateUnifiedMeansTest,
  buildDiagnosticsPayload,
} from "@chapterai/means-test";
import type { ClassifiedTradeline } from "@chapterai/forms";
import {
  classifyCreditTradelines,
  scheduleSummary,
  SANDBOX_TRADELINES,
  createCreditProvider,
} from "@chapterai/credit";
import { optimizeExemptions } from "@chapterai/exemption-optimizer";

/** In-memory dev store when DATABASE_URL is unavailable */
export interface DemoReviewField {
  id: string;
  fieldPath: string;
  formId: string;
  proposedValue: unknown;
  confidence: number;
  approvalState: "pending" | "approved" | "edited" | "questioned";
  rationale?: string;
  sourceDocument?: { id: string; fileName: string };
}

interface DemoMatterState {
  matterId: string;
  debtorDisplayName: string;
  chapter: "7" | "13";
  reviewFields: DemoReviewField[];
  diagnostics: MatterDiagnosticsPayload;
  classifiedTradelines: ClassifiedTradeline[];
  creditPulled: boolean;
}

const DEFAULT_DEDUCTIONS = {
  livingExpenses: "3200.00",
  securedDebtPayments: "2470.00",
  priorityClaims: "350.00",
  chapter13AdminExpenses: "0.00",
  retirementContributions: "0.00",
  domesticSupport: "350.00",
  specialCircumstancesExpenses: "0.00",
  healthInsurance: "450.00",
  careExpenses: "0.00",
  domesticViolenceExpenses: "0.00",
  charitableContributions: "0.00",
  educationalExpenses: "0.00",
  otherAdjustments: "0.00",
};

function buildInitialDiagnostics(): MatterDiagnosticsPayload {
  const meansTest = evaluateUnifiedMeansTest({
    chapter: "7",
    householdSize: 2,
    annualIncome: "72000.00",
    deductions: DEFAULT_DEDUCTIONS,
  });
  const exemptions = optimizeExemptions([
    {
      id: "home",
      category: "homestead",
      description: "Primary residence",
      currentValue: "685000.00",
      equity: "485000.00",
    },
    { id: "vehicle", category: "motor_vehicle", description: "2019 Toyota Camry", currentValue: "12000.00" },
    { id: "retirement", category: "retirement", description: "401(k)", currentValue: "45000.00" },
  ]);
  return buildDiagnosticsPayload({
    meansTest,
    missingFields: 3,
    exemptionGaps: 0,
    creditSummary: undefined,
  });
}

const INITIAL_FIELDS: DemoReviewField[] = [
  {
    id: "f1",
    fieldPath: "debtor1.firstName",
    formId: "101",
    proposedValue: "Maria",
    confidence: 0.98,
    approvalState: "pending",
    sourceDocument: { id: "d1", fileName: "drivers_license.pdf" },
    rationale: "Extracted from California driver's license OCR",
  },
  {
    id: "f2",
    fieldPath: "debtor1.lastName",
    formId: "101",
    proposedValue: "Martinez",
    confidence: 0.98,
    approvalState: "pending",
    sourceDocument: { id: "d1", fileName: "drivers_license.pdf" },
  },
  {
    id: "f3",
    fieldPath: "debtor1MonthlyIncome",
    formId: "106I",
    proposedValue: "6000.00",
    confidence: 0.94,
    approvalState: "pending",
    sourceDocument: { id: "d3", fileName: "paystub_jan_2025.pdf" },
    rationale: "Gross monthly from ADP paystub",
  },
];

const demoStore = new Map<string, DemoMatterState>();

function getOrCreate(matterId: string): DemoMatterState {
  let state = demoStore.get(matterId);
  if (!state) {
    state = {
      matterId,
      debtorDisplayName: "Martinez",
      chapter: "7",
      reviewFields: [...INITIAL_FIELDS],
      diagnostics: buildInitialDiagnostics(),
      classifiedTradelines: [],
      creditPulled: false,
    };
    demoStore.set(matterId, state);
  }
  return state;
}

export function isDemoMatter(matterId: string): boolean {
  return matterId === "demo" || matterId.startsWith("demo-");
}

export function getDemoReviewFields(matterId: string): DemoReviewField[] {
  return getOrCreate(matterId).reviewFields;
}

export function getDemoDiagnostics(matterId: string): MatterDiagnosticsPayload {
  return getOrCreate(matterId).diagnostics;
}

export function updateDemoFieldApproval(
  matterId: string,
  fieldId: string,
  approvalState: DemoReviewField["approvalState"],
  approvedValue?: unknown
): DemoReviewField | null {
  const state = getOrCreate(matterId);
  const field = state.reviewFields.find((f) => f.id === fieldId);
  if (!field) return null;
  field.approvalState = approvalState;
  if (approvedValue !== undefined) field.proposedValue = approvedValue;
  return field;
}

export async function runDemoCreditPull(matterId: string): Promise<{
  classified: ClassifiedTradeline[];
  summary: ReturnType<typeof scheduleSummary>;
}> {
  const state = getOrCreate(matterId);
  const provider = createCreditProvider();
  const pull = await provider.pullTriMerge({
    matterId: "00000000-0000-0000-0000-000000000099",
    firmId: "00000000-0000-0000-0000-000000000010",
    debtorFirstName: "Maria",
    debtorLastName: "Martinez",
    ssnLast4: "1234",
    consentTimestamp: new Date().toISOString(),
  });

  const classified = classifyCreditTradelines(pull.tradelines.length ? pull.tradelines : SANDBOX_TRADELINES);
  const summary = scheduleSummary(classified);

  const creditFields: DemoReviewField[] = classified.map((tl, i) => ({
    id: `credit-${tl.id}`,
    fieldPath: `creditors.${i}.creditorName`,
    formId: tl.schedule === "D" ? "106D" : tl.schedule === "G" ? "106G" : "106E/F",
    proposedValue: tl.creditorName,
    confidence: tl.confidence,
    approvalState: "pending" as const,
    rationale: `${tl.rationale} — Balance $${tl.balance}`,
    sourceDocument: { id: "credit-report", fileName: "tri_merge_credit_report.pdf" },
  }));

  state.reviewFields = [...state.reviewFields, ...creditFields];
  state.classifiedTradelines = classified;
  state.creditPulled = true;

  const securedPayments = classified
    .filter((t) => t.schedule === "D")
    .reduce((acc, t) => acc + parseFloat(t.monthlyPayment ?? "0"), 0)
    .toFixed(2);

  const meansTest = evaluateUnifiedMeansTest({
    chapter: state.chapter,
    householdSize: 2,
    annualIncome: "72000.00",
    deductions: {
      ...DEFAULT_DEDUCTIONS,
      securedDebtPayments: securedPayments !== "0.00" ? securedPayments : DEFAULT_DEDUCTIONS.securedDebtPayments,
    },
  });

  state.diagnostics = buildDiagnosticsPayload({
    meansTest,
    missingFields: Math.max(0, 3 - creditFields.length),
    exemptionGaps: 0,
    creditSummary: summary,
  });

  return { classified, summary };
}

export function getDemoTradelines(matterId: string): ClassifiedTradeline[] {
  return getOrCreate(matterId).classifiedTradelines;
}

export function recomputeDemoDiagnostics(
  matterId: string,
  input: {
    householdSize?: number;
    annualIncome?: string;
    chapter?: "7" | "13";
  }
): MatterDiagnosticsPayload {
  const state = getOrCreate(matterId);
  if (input.chapter) state.chapter = input.chapter;

  const meansTest = evaluateUnifiedMeansTest({
    chapter: state.chapter,
    householdSize: input.householdSize ?? 2,
    annualIncome: input.annualIncome ?? "72000.00",
    deductions: DEFAULT_DEDUCTIONS,
  });

  state.diagnostics = buildDiagnosticsPayload({
    meansTest,
    missingFields: state.reviewFields.filter((f) => f.approvalState === "pending").length,
    exemptionGaps: 0,
    creditSummary: state.creditPulled ? scheduleSummary(state.classifiedTradelines) : undefined,
  });

  return state.diagnostics;
}
