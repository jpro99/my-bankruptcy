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
import type { FilingResult } from "@chapterai/efile";
import type { AutopilotTimeline } from "@chapterai/autopilot";
import type { MatterInvoice } from "@chapterai/billing";
import type { CaliforniaDistrict } from "@chapterai/districts";
import {
  getDefaultDivision,
  getDistrictForCounty,
  getDistrictProfile,
} from "@chapterai/districts";
import { assemblePetition, type PetitionView } from "@chapterai/petition";
import type { ProvenanceEventType } from "@chapterai/provenance";
import { exportProvenanceBundle, type ProvenanceRecord } from "@chapterai/provenance";

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

export interface PortalDocumentRequest {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "open" | "uploaded" | "complete";
  uploadedFileName?: string;
}

export interface DemoPortalState {
  token: string;
  matterId: string;
  debtorName: string;
  chapter: "7" | "13";
  caseNumber?: string;
  requests: PortalDocumentRequest[];
  message: string;
}

export interface DemoAsset {
  id: string;
  description: string;
  category: string;
  currentValue: string;
  securedAmount?: string;
  exemptionSystem?: string;
  exemptionAmount?: string;
}

export interface DemoDistrictInfo {
  district: CaliforniaDistrict;
  county: string;
  divisionId: string;
  divisionName: string;
  courtName: string;
}

interface DemoMatterState {
  matterId: string;
  debtorDisplayName: string;
  chapter: "7" | "13";
  district: CaliforniaDistrict;
  county: string;
  divisionId: string;
  divisionName: string;
  assets: DemoAsset[];
  provenanceEvents: ProvenanceRecord[];
  reviewFields: DemoReviewField[];
  diagnostics: MatterDiagnosticsPayload;
  classifiedTradelines: ClassifiedTradeline[];
  creditPulled: boolean;
  filing?: FilingResult;
  autopilot?: AutopilotTimeline;
  billing?: MatterInvoice;
  portal?: DemoPortalState;
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

const DEFAULT_ASSETS: DemoAsset[] = [
  {
    id: "home",
    description: "Primary residence — 1234 Oak Ave, Los Angeles CA",
    category: "homestead",
    currentValue: "685000.00",
    securedAmount: "200000.00",
    exemptionSystem: "System 2",
    exemptionAmount: "685000.00",
  },
  {
    id: "vehicle",
    description: "2019 Toyota Camry",
    category: "motor_vehicle",
    currentValue: "12000.00",
    securedAmount: "8500.00",
    exemptionSystem: "System 2",
    exemptionAmount: "7500.00",
  },
  {
    id: "retirement",
    description: "401(k) — Fidelity",
    category: "retirement",
    currentValue: "45000.00",
    exemptionSystem: "Federal",
    exemptionAmount: "45000.00",
  },
];

const FIRM_ID = "00000000-0000-0000-0000-000000000010";
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

function seedProvenanceForFields(
  matterId: string,
  fields: DemoReviewField[]
): ProvenanceRecord[] {
  return fields.map((f, i) => ({
    id: `prov-seed-${f.id}`,
    formFieldId: f.id,
    matterId,
    firmId: FIRM_ID,
    eventType: "ai_extracted" as const,
    newValue: f.proposedValue,
    sourceDocumentId: f.sourceDocument?.id,
    modelName: "claude-sonnet-4.5",
    modelVersion: "2025-06",
    confidence: f.confidence,
    createdAt: new Date(Date.now() - (fields.length - i) * 60_000).toISOString(),
    metadata: { fieldPath: f.fieldPath, formId: f.formId, rationale: f.rationale },
  }));
}

function buildInitialState(matterId: string): DemoMatterState {
  const county = "Los Angeles";
  const district = getDistrictForCounty(county);
  const division = getDefaultDivision(district, county);
  const fields = [...INITIAL_FIELDS];

  return {
    matterId,
    debtorDisplayName: "Martinez",
    chapter: "7",
    district,
    county,
    divisionId: division.id,
    divisionName: division.name,
    assets: [...DEFAULT_ASSETS],
    provenanceEvents: seedProvenanceForFields(matterId, fields),
    reviewFields: fields,
    diagnostics: buildInitialDiagnostics(),
    classifiedTradelines: [],
    creditPulled: false,
  };
}

const demoStore = new Map<string, DemoMatterState>();

function getOrCreate(matterId: string): DemoMatterState {
  let state = demoStore.get(matterId);
  if (!state) {
    state = buildInitialState(matterId);
    demoStore.set(matterId, state);
  }
  return state;
}

export function recordDemoProvenance(
  matterId: string,
  input: {
    formFieldId: string;
    eventType: ProvenanceEventType;
    previousValue?: unknown;
    newValue: unknown;
    actorUserId?: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }
): ProvenanceRecord {
  const state = getOrCreate(matterId);
  const record: ProvenanceRecord = {
    id: crypto.randomUUID(),
    formFieldId: input.formFieldId,
    matterId,
    firmId: FIRM_ID,
    eventType: input.eventType,
    previousValue: input.previousValue,
    newValue: input.newValue,
    actorUserId: input.actorUserId ?? DEV_USER_ID,
    confidence: input.confidence,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };
  state.provenanceEvents.push(record);
  return record;
}

export function getDemoProvenanceEvents(matterId: string): ProvenanceRecord[] {
  return getOrCreate(matterId).provenanceEvents;
}

export function exportDemoProvenance(matterId: string) {
  return exportProvenanceBundle(getDemoProvenanceEvents(matterId), matterId);
}

export function getDemoDistrictInfo(matterId: string): DemoDistrictInfo {
  const state = getOrCreate(matterId);
  const profile = getDistrictProfile(state.district);
  return {
    district: state.district,
    county: state.county,
    divisionId: state.divisionId,
    divisionName: state.divisionName,
    courtName: profile.courtName,
  };
}

export function setDemoDistrict(
  matterId: string,
  input: { district?: CaliforniaDistrict; county?: string }
): DemoDistrictInfo {
  const state = getOrCreate(matterId);
  if (input.county) {
    state.county = input.county;
    if (!input.district) {
      state.district = getDistrictForCounty(input.county);
    }
  }
  if (input.district) {
    state.district = input.district;
  }
  const division = getDefaultDivision(state.district, state.county);
  state.divisionId = division.id;
  state.divisionName = division.name;
  return getDemoDistrictInfo(matterId);
}

export function assembleDemoPetition(matterId: string): PetitionView {
  const state = getOrCreate(matterId);
  return assemblePetition({
    matterId,
    district: state.district,
    division: state.divisionName,
    county: state.county,
    chapter: state.chapter,
    debtorDisplayName: state.debtorDisplayName,
    reviewFields: state.reviewFields,
    tradelines: state.classifiedTradelines.map((t) => ({
      id: t.id,
      creditorName: t.creditorName,
      schedule: t.schedule,
      balance: t.balance,
      monthlyPayment: t.monthlyPayment,
      confidence: t.confidence,
      collateralDescription: t.collateralDescription,
      approvalState: (() => {
        const s = state.reviewFields.find((f) => f.id === `credit-${t.id}`)?.approvalState;
        if (s === "questioned") return "pending" as const;
        return s;
      })(),
    })),
    assets: state.assets,
  });
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
  const previousValue = field.proposedValue;
  field.approvalState = approvalState;
  if (approvedValue !== undefined) field.proposedValue = approvedValue;

  const eventType: ProvenanceEventType =
    approvalState === "approved"
      ? "attorney_approved"
      : approvalState === "edited"
        ? "attorney_edited"
        : approvalState === "questioned"
          ? "attorney_questioned"
          : "ai_extracted";

  if (eventType !== "ai_extracted") {
    recordDemoProvenance(matterId, {
      formFieldId: fieldId,
      eventType,
      previousValue,
      newValue: field.proposedValue,
      confidence: field.confidence,
      metadata: { fieldPath: field.fieldPath, formId: field.formId },
    });
  }

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

  for (const cf of creditFields) {
    recordDemoProvenance(matterId, {
      formFieldId: cf.id,
      eventType: "credit_imported",
      newValue: cf.proposedValue,
      confidence: cf.confidence,
      metadata: { fieldPath: cf.fieldPath, formId: cf.formId, source: "tri_merge" },
    });
  }

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

export function getDemoMatterMeta(matterId: string) {
  const state = getOrCreate(matterId);
  return {
    matterId: state.matterId,
    debtorDisplayName: state.debtorDisplayName,
    chapter: state.chapter,
    firmId: FIRM_ID,
    district: state.district,
    county: state.county,
    divisionName: state.divisionName,
  };
}

export function getApprovedFormIds(matterId: string): string[] {
  const state = getOrCreate(matterId);
  const formIds = new Set<string>();
  for (const field of state.reviewFields) {
    if (field.approvalState === "approved" || field.approvalState === "edited") {
      formIds.add(field.formId);
    }
  }
  // Demo matter includes full petition packet once fields approved
  if (formIds.size >= state.reviewFields.length && state.reviewFields.length > 0) {
    return [
      "101",
      "106A/B",
      "106C",
      "106D",
      "106E/F",
      "106G",
      "106H",
      "106I",
      "106J",
      "107",
      state.chapter === "13" ? "122C-1" : "122A-1",
      state.chapter === "13" ? "122C-2" : "122A-2",
      "cert-counsel",
      "3015-1.7",
      "MML",
      ...(state.chapter === "13" ? ["3015-1.01"] : []),
    ];
  }
  return [...formIds];
}

export function getDemoFiling(matterId: string): FilingResult | undefined {
  return getOrCreate(matterId).filing;
}

export function setDemoFiling(matterId: string, filing: FilingResult): FilingResult {
  const state = getOrCreate(matterId);
  state.filing = filing;
  if (state.portal) {
    state.portal.caseNumber = filing.caseNumber;
    state.portal.message = "Your case has been filed. Please upload the documents below.";
  }
  return filing;
}

export function getDemoAutopilot(matterId: string): AutopilotTimeline | undefined {
  return getOrCreate(matterId).autopilot;
}

export function setDemoAutopilot(matterId: string, timeline: AutopilotTimeline): AutopilotTimeline {
  const state = getOrCreate(matterId);
  state.autopilot = timeline;
  return timeline;
}

const DEFAULT_PORTAL_REQUESTS: Omit<PortalDocumentRequest, "id">[] = [
  {
    title: "Pay stubs (last 60 days)",
    description: "Upload all pay advices received in the 60 days before filing",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: "open",
  },
  {
    title: "Tax returns (last 2 years)",
    description: "Federal returns for the year filed and prior year",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "open",
  },
  {
    title: "Bank statements (last 3 months)",
    description: "All accounts — checking, savings, Venmo, etc.",
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    status: "open",
  },
];

function buildPortal(matterId: string, state: DemoMatterState): DemoPortalState {
  return {
    token: `${matterId}-client`,
    matterId,
    debtorName: state.debtorDisplayName,
    chapter: state.chapter,
    caseNumber: state.filing?.caseNumber,
    requests: state.portal?.requests ?? DEFAULT_PORTAL_REQUESTS.map((r, i) => ({
      ...r,
      id: `req-${i + 1}`,
    })),
    message: state.filing
      ? "Your case has been filed. Please upload the documents below."
      : "Welcome — your attorney will file soon. Upload documents to speed things up.",
  };
}

export function isDemoPortalToken(token: string): boolean {
  return token === "demo-client" || token.endsWith("-client");
}

export function getDemoPortal(token: string): DemoPortalState {
  const matterId = token.replace(/-client$/, "") || "demo";
  const state = getOrCreate(matterId);
  if (!state.portal) {
    state.portal = buildPortal(matterId, state);
  }
  return state.portal;
}

export function getDemoPortalOpenCount(matterId: string): number {
  const token = `${matterId}-client`;
  const portal = getDemoPortal(token);
  return portal.requests.filter((r) => r.status === "open").length;
}

export function submitPortalUpload(
  token: string,
  requestId: string,
  fileName: string
): PortalDocumentRequest | null {
  const matterId = token.replace(/-client$/, "") || "demo";
  const state = getOrCreate(matterId);
  const portal = getDemoPortal(token);
  const req = portal.requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = "uploaded";
  req.uploadedFileName = fileName;
  state.portal = portal;
  return req;
}

export function completePortalRequest(
  token: string,
  requestId: string
): PortalDocumentRequest | null {
  const matterId = token.replace(/-client$/, "") || "demo";
  const state = getOrCreate(matterId);
  const portal = getDemoPortal(token);
  const req = portal.requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = "complete";
  state.portal = portal;
  return req;
}

export function getDemoBilling(matterId: string): MatterInvoice | undefined {
  return getOrCreate(matterId).billing;
}

export function setDemoBilling(matterId: string, invoice: MatterInvoice): MatterInvoice {
  const state = getOrCreate(matterId);
  state.billing = invoice;
  return invoice;
}
