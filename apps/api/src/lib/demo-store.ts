import { FIRM_ATTORNEY_NAME } from "./firm-brand.js";
import {
  buildUploadMatchPreview,
  extractIdentityFromDocument,
  type UploadMatchPreview,
} from "./document-identity-match.js";
import {
  evaluateUnifiedMeansTest,
  buildDiagnosticsPayload,
  type MatterDiagnosticsPayload,
} from "@chapterai/means-test";
import type { ClassifiedTradeline } from "@chapterai/forms";
import {
  classifyCreditTradelines,
  scheduleSummary,
  SANDBOX_TRADELINES,
  createCreditProvider,
  adviseTradelineInclusion,
} from "@chapterai/credit";
import { optimizeExemptions } from "@chapterai/exemption-optimizer";
import type { FilingResult } from "@chapterai/efile";
import type { AutopilotTimeline } from "@chapterai/autopilot";
import { generateTimeline } from "@chapterai/autopilot";
import type { MatterInvoice } from "@chapterai/billing";
import { generateInvoice } from "@chapterai/billing";
import type { CaliforniaDistrict } from "@chapterai/districts";
import {
  getCourtReadiness,
  getDefaultDivision,
  getDistrictForCounty,
  getDistrictProfile,
} from "@chapterai/districts";
import { computeMatterProgress } from "@chapterai/matter-guide";
import { assemblePetition, type PetitionView, type ValuationProvenance } from "@chapterai/petition";
import type { ProvenanceEventType } from "@chapterai/provenance";
import { exportProvenanceBundle, type ProvenanceRecord } from "@chapterai/provenance";
import { loadDemoStore, persistDemoStore } from "./demo-persist.js";
import { portalTokenForMatter, verifyPortalToken } from "./secure-token.js";
import {
  buildIntakeCalendarEvents,
  buildPostFilingCalendarEvents,
  type MatterCalendarEvent,
} from "./matter-calendar.js";
import { buildFinalReviewSnapshot, type FinalReviewSnapshot } from "./final-review.js";

export { portalTokenForMatter };

/** In-memory dev store when DATABASE_URL is unavailable */
export interface DemoReviewField {
  id: string;
  fieldPath: string;
  formId: string;
  proposedValue: unknown;
  confidence: number;
  approvalState: "pending" | "approved" | "edited" | "questioned";
  /** Human-readable schedule line (Form 106I/J, etc.) */
  lineLabel?: string;
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

export interface PortalCounselingCourse {
  status: "locked" | "pending" | "complete";
  completedAt?: string;
  certificateFileName?: string;
  certificateNumber?: string;
}

export interface PortalCounseling {
  tier: "gold" | "relay" | "vault";
  provider: string;
  providerLabel: string;
  providerUrl: string;
  course1: PortalCounselingCourse;
  course2: PortalCounselingCourse;
}

export interface DemoPortalState {
  token: string;
  matterId: string;
  debtorName: string;
  chapter: "7" | "13";
  caseNumber?: string;
  requests: PortalDocumentRequest[];
  message: string;
  counseling: PortalCounseling;
  filed: boolean;
}

export interface MatterNote {
  id: string;
  text: string;
  source: "attorney" | "voice" | "system";
  createdAt: string;
  authorLabel: string;
}

export interface PortalMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  createdAt: string;
  readAt?: string;
  staffAuthor?: string;
}

export interface PortalActivityEvent {
  id: string;
  alertType: string;
  body: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export type IntakeDocStatus = "received" | "processed" | "applied";

export interface IntakeDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
  uploadedBy: "client" | "attorney";
  source: "portal" | "portal_general" | "attorney_drop" | "consult" | "test_csv";
  requestId?: string;
  status: IntakeDocStatus;
  appliedFieldIds?: string[];
  mimeType?: string;
  storageKey?: string;
  sha256?: string;
  sizeBytes?: number;
  stored?: boolean;
  staffVerified?: boolean;
  staffVerifiedAt?: string;
  staffVerifiedBy?: string;
  staffNote?: string;
}

export interface ConsultSnapshot {
  debtorName: string;
  householdSize: number;
  annualIncome: string;
  monthlyExpenses: string;
  securedDebt: string;
  unsecuredDebt: string;
  chapterPreference: "7" | "13" | "undecided";
  takeCase: "yes" | "maybe" | "no" | null;
  attorneyNotes: string;
  evaluatedAt?: string;
  recommendation?: "chapter_7" | "chapter_13" | "review_required";
  meansTestStatus?: "pass" | "fail" | "review";
  recommendationRationale?: string;
  presumptionOfAbuse?: boolean;
}

export interface DemoMatterSummary {
  matterId: string;
  debtorDisplayName: string;
  chapter: "7" | "13";
  status: "prospect" | "active" | "filed";
  consultComplete: boolean;
  pendingDocuments: number;
  noteCount: number;
  unreadPortalMessages: number;
  createdAt: string;
  clientEmail?: string;
  clientPhone?: string;
  clientFirstName?: string;
  clientLastName?: string;
  /** Case pipeline — one-screen ops (Best Case style) */
  overallPercent: number;
  currentPhase: "consult" | "prep" | "file" | "post-filing";
  currentStep: string;
  balanceDue: string;
  paidInFull: boolean;
  /** Potential = not retained · Active = in progress · Completed = discharged */
  lifecycleStage: "potential" | "active" | "completed";
  lastContactAt?: string;
  lastContactKind?: "portal" | "note";
  county?: string;
  divisionName?: string;
}

export type ScheduleBucket = "D" | "E" | "F" | "G";

export interface DemoTradeline extends ClassifiedTradeline {
  isManual?: boolean;
  isDuplicate?: boolean;
  duplicateOfId?: string;
}

export interface DemoAsset {
  id: string;
  description: string;
  category: string;
  currentValue: string;
  securedAmount?: string;
  exemptionSystem?: string;
  exemptionAmount?: string;
  valuation?: ValuationProvenance;
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
  classifiedTradelines: DemoTradeline[];
  /** tradeline id → include on petition schedules (attorney credit review) */
  tradelineInclusion: Record<string, boolean>;
  creditPulled: boolean;
  filing?: FilingResult;
  autopilot?: AutopilotTimeline;
  billing?: MatterInvoice;
  portal?: DemoPortalState;
  counselingTier?: "gold" | "relay" | "vault";
  counselingProvider?: string;
  notes: MatterNote[];
  intakeDocuments: IntakeDocument[];
  portalMessages: PortalMessage[];
  portalActivity: PortalActivityEvent[];
  consult?: ConsultSnapshot;
  createdAt: string;
  clientEmail?: string;
  clientPhone?: string;
  clientFirstName?: string;
  clientLastName?: string;
  calendarEvents?: MatterCalendarEvent[];
  finalReview?: {
    documentsQaComplete?: boolean;
    documentsQaAt?: string;
    numbersQaComplete?: boolean;
    numbersQaAt?: string;
    attorneySignOff?: boolean;
    attorneySignOffAt?: string;
    attorneyName?: string;
  };
  dischargeFollowUp?: {
    clientEmail: string;
    includePiCrossSell: boolean;
    sentAt: string;
    emailOk: boolean;
  };
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
    valuation: {
      tier: "medium",
      selectedAmount: "685000.00",
      lowAmount: "620000.00",
      mediumAmount: "685000.00",
      highAmount: "745000.00",
      sourceName: "Los Angeles County Assessor + Zillow Zestimate",
      sourceUrl: "https://assessor.lacounty.gov",
      lookupDate: "2025-06-10",
      method: "County assessed value (2024 roll) cross-checked with Zestimate range",
      snapshotLines: [
        "Los Angeles County Assessor — Property Search",
        "Parcel: 1234-OAK-AV-LA",
        "Owner of record: Maria Martinez",
        "Site address: 1234 Oak Ave, Los Angeles CA 90001",
        "Land value: $285,000",
        "Improvement value: $335,000",
        "Total assessed value (2024): $620,000",
        "Zillow Zestimate range: $655,000 – $715,000",
        "Attorney selected: $685,000 (mid-range, Schedule A/B current value)",
      ],
    },
  },
  {
    id: "vehicle",
    description: "2019 Toyota Camry",
    category: "motor_vehicle",
    currentValue: "12000.00",
    securedAmount: "8500.00",
    exemptionSystem: "System 2",
    exemptionAmount: "7500.00",
    valuation: {
      tier: "medium",
      selectedAmount: "12000.00",
      lowAmount: "10200.00",
      mediumAmount: "12000.00",
      highAmount: "13800.00",
      sourceName: "Kelley Blue Book (KBB.com)",
      sourceUrl: "https://www.kbb.com",
      lookupDate: "2025-06-10",
      method: "Private Party Value — Good condition, ~68,000 miles, Los Angeles CA",
      snapshotLines: [
        "Kelley Blue Book — Used Car Values",
        "2019 Toyota Camry LE 4-Door Sedan",
        "Zip code: 90001 (Los Angeles, CA)",
        "Mileage: 68,000",
        "Condition: Good",
        "Trade-In Value: $10,200",
        "Private Party Value: $12,000  ← selected for Schedule A/B",
        "Dealer Retail Value: $13,800",
        "VIN (from credit report): matched Toyota Financial tradeline",
      ],
    },
  },
  {
    id: "retirement",
    description: "401(k) — Fidelity",
    category: "retirement",
    currentValue: "45000.00",
    exemptionSystem: "Federal",
    exemptionAmount: "45000.00",
    valuation: {
      tier: "high",
      selectedAmount: "45000.00",
      sourceName: "Fidelity account statement (client upload)",
      lookupDate: "2025-06-08",
      method: "Most recent quarterly statement balance — no range estimate",
      snapshotLines: [
        "Fidelity NetBenefits — Account Summary",
        "Account: ****8821",
        "Plan: Riverside Medical Group 401(k)",
        "Participant: Maria Martinez",
        "Statement date: March 31, 2025",
        "Total balance: $45,000.00",
        "Note: Retirement accounts typically valued at statement balance (no KBB-style range)",
      ],
    },
  },
];

const FIRM_ID = "00000000-0000-0000-0000-000000000010";
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

/** Dev/demo firm id — matches @chapterai/auth DEV_SESSION */
export function getDemoFirmId(): string {
  return FIRM_ID;
}

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

function ensureDemoContactDefaults(state: DemoMatterState): void {
  if (state.matterId === "demo") {
    if (!state.clientPhone) state.clientPhone = "(909) 555-0142";
    if (!state.clientEmail) state.clientEmail = "maria.martinez@example.com";
    if (!state.clientFirstName) state.clientFirstName = "Maria";
    if (!state.clientLastName) state.clientLastName = "Martinez";
  }
}

function buildInitialState(matterId: string): DemoMatterState {
  const county = "Riverside";
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
    tradelineInclusion: {},
    creditPulled: false,
    notes: [],
    intakeDocuments: [],
    portalMessages: [],
    portalActivity: [],
    createdAt: "2025-06-01T00:00:00.000Z",
  };
}

function buildProspectState(
  matterId: string,
  input: { debtorDisplayName: string; chapter?: "7" | "13"; county?: string }
): DemoMatterState {
  const county = input.county ?? "Riverside";
  const district = getDistrictForCounty(county);
  const division = getDefaultDivision(district, county);
  const chapter = input.chapter ?? "7";

  return {
    matterId,
    debtorDisplayName: input.debtorDisplayName,
    chapter,
    district,
    county,
    divisionId: division.id,
    divisionName: division.name,
    assets: [],
    provenanceEvents: [],
    reviewFields: [],
    diagnostics: buildInitialDiagnostics(),
    classifiedTradelines: [],
    tradelineInclusion: {},
    creditPulled: false,
    notes: [],
    intakeDocuments: [],
    portalMessages: [],
    portalActivity: [],
    createdAt: new Date().toISOString(),
  };
}

const demoStore = new Map<string, DemoMatterState>();
loadDemoStore(demoStore);

function saveSnapshot(): void {
  persistDemoStore(demoStore);
}

function formIdForSchedule(schedule: ScheduleBucket): string {
  if (schedule === "D") return "106D";
  if (schedule === "G") return "106G";
  return "106E/F";
}

function recomputeTradelineDiagnostics(state: DemoMatterState): void {
  const securedPayments = getIncludedTradelines(state)
    .filter((t) => t.schedule === "D")
    .reduce((acc, t) => acc + parseFloat(t.monthlyPayment ?? "0"), 0)
    .toFixed(2);

  const meansTest = evaluateUnifiedMeansTest({
    chapter: state.chapter,
    householdSize: 2,
    annualIncome: "72000.00",
    deductions: {
      ...DEFAULT_DEDUCTIONS,
      securedDebtPayments:
        securedPayments !== "0.00" ? securedPayments : DEFAULT_DEDUCTIONS.securedDebtPayments,
    },
  });

  state.diagnostics = buildDiagnosticsPayload({
    meansTest,
    missingFields: state.reviewFields.filter((f) => f.approvalState === "pending").length,
    exemptionGaps: 0,
    creditSummary: state.creditPulled
      ? scheduleSummary(getIncludedTradelines(state))
      : undefined,
  });
}

function getIncludedTradelines(state: DemoMatterState): DemoTradeline[] {
  return state.classifiedTradelines.filter(
    (t) => state.tradelineInclusion[t.id] !== false && !t.isDuplicate
  );
}

function countPendingCreditApply(state: DemoMatterState): number {
  if (!state.creditPulled) return 0;
  return getIncludedTradelines(state).filter((tl) => {
    const field = state.reviewFields.find((f) => f.id === `credit-${tl.id}`);
    return field?.approvalState === "pending";
  }).length;
}

function countPendingForgeApply(state: DemoMatterState): number {
  const pendingDocs = state.intakeDocuments.filter((d) => d.status !== "applied").length;
  return pendingDocs + countPendingCreditApply(state);
}

function applyPendingCreditToPetition(
  matterId: string,
  state: DemoMatterState
): { approvedCount: number; fieldIds: string[] } {
  const fieldIds: string[] = [];

  for (const tl of getIncludedTradelines(state)) {
    const fieldId = `credit-${tl.id}`;
    const field = state.reviewFields.find((f) => f.id === fieldId);
    if (!field || field.approvalState !== "pending") continue;

    const previousValue = field.proposedValue;
    field.approvalState = "approved";
    fieldIds.push(fieldId);

    recordDemoProvenance(matterId, {
      formFieldId: fieldId,
      eventType: "attorney_approved",
      previousValue,
      newValue: field.proposedValue,
      confidence: field.confidence,
      metadata: {
        fieldPath: field.fieldPath,
        formId: field.formId,
        schedule: tl.schedule,
        via: "forge_sync_credit",
      },
    });
  }

  if (fieldIds.length > 0) {
    recomputeTradelineDiagnostics(state);
    addMatterNote(matterId, {
      text: `Apply to petition — ${fieldIds.length} credit tradeline(s) on schedules D–G`,
      source: "system",
      authorLabel: "Apply to Petition",
    });
  }

  return { approvedCount: fieldIds.length, fieldIds };
}

function getOrCreate(matterId: string): DemoMatterState {
  let state = demoStore.get(matterId);
  if (!state) {
    state = buildInitialState(matterId);
    demoStore.set(matterId, state);
  }
  if (!state.tradelineInclusion) {
    state.tradelineInclusion = {};
    for (const tl of state.classifiedTradelines) {
      state.tradelineInclusion[tl.id] = true;
    }
  }
  if (!state.notes) state.notes = [];
  if (!state.intakeDocuments) state.intakeDocuments = [];
  if (!state.portalMessages) state.portalMessages = [];
  if (!state.portalActivity) state.portalActivity = [];
  if (!state.createdAt) state.createdAt = new Date().toISOString();
  if (!state.calendarEvents) state.calendarEvents = [];
  if (!state.finalReview) state.finalReview = {};
  ensureDemoContactDefaults(state);
  for (const asset of state.assets) {
    if (!asset.valuation) {
      const seed = DEFAULT_ASSETS.find((a) => a.id === asset.id);
      if (seed?.valuation) asset.valuation = seed.valuation;
    }
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
  saveSnapshot();
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

export function getDemoCourtReadiness(matterId: string) {
  const state = getOrCreate(matterId);
  const efileMode = process.env.EFILE_MODE === "live" ? "live" : "sandbox";
  const readiness = getCourtReadiness({
    county: state.county,
    chapter: state.chapter,
    efileMode,
  });
  const packetFormIds = getFullPacketFormIds(state.chapter);
  return {
    matterId,
    readiness,
    formsInPracticePacket: packetFormIds.length,
    formsMatchDistrict: readiness.requiredForms.length === packetFormIds.length,
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
  saveSnapshot();
  return getDemoDistrictInfo(matterId);
}

/** Official Form 106J expense categories — attorney-editable monthly amounts */
export const SCHEDULE_J_LINES = [
  { id: "j-01", fieldPath: "expenses.housing", lineLabel: "Housing, mortgage, or rent" },
  { id: "j-02", fieldPath: "expenses.utilities", lineLabel: "Utilities" },
  { id: "j-03", fieldPath: "expenses.food", lineLabel: "Food and housekeeping supplies" },
  {
    id: "j-04",
    fieldPath: "expenses.clothing",
    lineLabel: "Clothing, laundry, and dry cleaning",
  },
  {
    id: "j-05",
    fieldPath: "expenses.personalCare",
    lineLabel: "Personal care products and services",
  },
  { id: "j-06", fieldPath: "expenses.medical", lineLabel: "Medical and dental expenses" },
  {
    id: "j-07",
    fieldPath: "expenses.transportation",
    lineLabel: "Transportation (not including car payments)",
  },
  {
    id: "j-08",
    fieldPath: "expenses.recreation",
    lineLabel: "Recreation, entertainment, newspapers, magazines, and books",
  },
  { id: "j-09", fieldPath: "expenses.charitable", lineLabel: "Charitable contributions" },
  {
    id: "j-10",
    fieldPath: "expenses.insurance",
    lineLabel: "Insurance (life, health, vehicle) not deducted elsewhere",
  },
  { id: "j-11", fieldPath: "expenses.taxes", lineLabel: "Taxes (not deducted elsewhere)" },
  {
    id: "j-12",
    fieldPath: "expenses.installment",
    lineLabel: "Installment payments (other than vehicle and home)",
  },
  {
    id: "j-13",
    fieldPath: "expenses.domesticSupport",
    lineLabel: "Alimony, maintenance, and support paid to others",
  },
  { id: "j-14", fieldPath: "expenses.other", lineLabel: "Other expenses not listed above" },
] as const;

/** Form 107 — Statement of Financial Affairs (key attorney questions) */
export const SOFA_LINES = [
  {
    id: "107-01",
    fieldPath: "sofa.payments600",
    lineLabel: "Payments to any creditor $600+ aggregate (last 2 years)",
  },
  {
    id: "107-02",
    fieldPath: "sofa.lawsuits",
    lineLabel: "Lawsuits, garnishments, attachments, repossessions (last year)",
  },
  {
    id: "107-03",
    fieldPath: "sofa.propertyTransferred",
    lineLabel: "Property transferred for benefit of creditor (last 2 years)",
  },
  {
    id: "107-04",
    fieldPath: "sofa.gifts",
    lineLabel: "Gifts or charitable contributions $600+ (last 2 years)",
  },
  {
    id: "107-05",
    fieldPath: "sofa.gambling",
    lineLabel: "Gambling losses (last 2 years)",
  },
  {
    id: "107-06",
    fieldPath: "sofa.business",
    lineLabel: "Business ownership or involvement (last 4 years)",
  },
  {
    id: "107-07",
    fieldPath: "sofa.closedAccounts",
    lineLabel: "Financial accounts closed or moved (last year)",
  },
  {
    id: "107-08",
    fieldPath: "sofa.priorBankruptcy",
    lineLabel: "Prior bankruptcy filed (last 8 years)",
  },
  {
    id: "107-09",
    fieldPath: "sofa.debtCounseling",
    lineLabel: "Consulted debt relief agency / credit counselor (last year)",
  },
  {
    id: "107-10",
    fieldPath: "sofa.environmental",
    lineLabel: "Environmental law claims or hazardous property",
  },
] as const;

export const SCHEDULE_I_LINES = [
  { id: "i-01", fieldPath: "income.debtor1", lineLabel: "Debtor 1 — gross monthly income" },
  { id: "i-02", fieldPath: "income.debtor2", lineLabel: "Debtor 2 — gross monthly income" },
  { id: "i-03", fieldPath: "income.other", lineLabel: "Other income" },
] as const;

export const ASSET_CATEGORY_OPTIONS = [
  { value: "homestead", label: "Real property (home, land)" },
  { value: "motor_vehicle", label: "Motor vehicle" },
  { value: "household_goods", label: "Household goods & furnishings" },
  { value: "clothing", label: "Clothing" },
  { value: "jewelry", label: "Jewelry" },
  { value: "cash", label: "Cash / bank accounts" },
  { value: "retirement", label: "Retirement accounts" },
  { value: "tools", label: "Tools of trade" },
  { value: "other", label: "Other personal property" },
] as const;

function ensureScheduleDefaults(state: DemoMatterState): boolean {
  let added = false;
  const src = { id: "schedule-defaults", fileName: "Schedule defaults" };
  for (const line of SCHEDULE_J_LINES) {
    if (!state.reviewFields.some((f) => f.id === line.id)) {
      state.reviewFields.push({
        id: line.id,
        fieldPath: line.fieldPath,
        formId: "106J",
        lineLabel: line.lineLabel,
        proposedValue: "0.00",
        confidence: 1,
        approvalState: "pending",
        rationale: "Attorney-entered monthly expense",
        sourceDocument: src,
      });
      added = true;
    }
  }
  for (const line of SCHEDULE_I_LINES) {
    if (state.reviewFields.some((f) => f.id === line.id)) continue;
    if (line.id === "i-01") {
      const legacy = state.reviewFields.find((f) => f.id === "f3" && f.formId === "106I");
      if (legacy) {
        if (!legacy.lineLabel) legacy.lineLabel = line.lineLabel;
        continue;
      }
    }
    state.reviewFields.push({
      id: line.id,
      fieldPath: line.fieldPath,
      formId: "106I",
      lineLabel: line.lineLabel,
      proposedValue: "0.00",
      confidence: 1,
      approvalState: "pending",
      rationale: "Attorney-entered monthly income",
      sourceDocument: src,
    });
    added = true;
  }
  for (const line of SOFA_LINES) {
    if (!state.reviewFields.some((f) => f.id === line.id)) {
      state.reviewFields.push({
        id: line.id,
        fieldPath: line.fieldPath,
        formId: "107",
        lineLabel: line.lineLabel,
        proposedValue: "No",
        confidence: 1,
        approvalState: "pending",
        rationale: "Attorney SOFA answer — Yes / No / N/A",
        sourceDocument: src,
      });
      added = true;
    }
  }
  return added;
}

function sumScheduleJExpenses(state: DemoMatterState): string {
  const total = state.reviewFields
    .filter((f) => f.formId === "106J")
    .reduce((acc, f) => acc + parseFloat(parseMoney(String(f.proposedValue ?? "0")) ?? "0"), 0);
  return total.toFixed(2);
}

export function assembleDemoPetition(matterId: string): PetitionView {
  const state = getOrCreate(matterId);
  if (ensureScheduleDefaults(state)) saveSnapshot();
  const includedTradelines = getIncludedTradelines(state);
  return assemblePetition({
    matterId,
    district: state.district,
    division: state.divisionName,
    county: state.county,
    chapter: state.chapter,
    debtorDisplayName: state.debtorDisplayName,
    reviewFields: state.reviewFields,
    tradelines: includedTradelines.map((t) => ({
      id: t.id,
      creditorName: t.creditorName,
      schedule: t.schedule,
      balance: t.balance,
      monthlyPayment: t.monthlyPayment,
      confidence: t.confidence,
      collateralDescription: t.collateralDescription,
      isManual: t.isManual,
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
  } else {
    saveSnapshot();
  }

  return field;
}

export async function runDemoCreditPull(matterId: string): Promise<{
  classified: ClassifiedTradeline[];
  summary: ReturnType<typeof scheduleSummary>;
}> {
  const state = getOrCreate(matterId);
  if (state.creditPulled && state.classifiedTradelines.length > 0) {
    const included = getIncludedTradelines(state);
    return {
      classified: state.classifiedTradelines,
      summary: scheduleSummary(included),
    };
  }

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
    formId: formIdForSchedule(tl.schedule),
    proposedValue: tl.creditorName,
    confidence: tl.confidence,
    approvalState: "pending" as const,
    rationale: `${tl.rationale} — Balance $${tl.balance}`,
    sourceDocument: { id: "credit-report", fileName: "tri_merge_credit_report.pdf" },
  }));

  state.reviewFields = [...state.reviewFields, ...creditFields];
  state.classifiedTradelines = classified;
  for (const tl of classified) {
    state.tradelineInclusion[tl.id] = true;
  }
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

  recomputeTradelineDiagnostics(state);

  saveSnapshot();
  return { classified, summary: scheduleSummary(getIncludedTradelines(state)) };
}

export function getDemoTradelines(matterId: string): DemoTradeline[] {
  return getOrCreate(matterId).classifiedTradelines;
}

export function getTradelineReview(matterId: string) {
  const state = getOrCreate(matterId);
  return state.classifiedTradelines.map((tl) => {
    const included = state.tradelineInclusion[tl.id] !== false && !tl.isDuplicate;
    const advice = adviseTradelineInclusion(tl);
    const duplicateOfName = tl.duplicateOfId
      ? state.classifiedTradelines.find((t) => t.id === tl.duplicateOfId)?.creditorName
      : undefined;
    return {
      ...tl,
      included,
      advice,
      fieldId: `credit-${tl.id}`,
      isManual: tl.isManual ?? false,
      isDuplicate: tl.isDuplicate ?? false,
      duplicateOfId: tl.duplicateOfId,
      duplicateOfName,
    };
  });
}

export interface TradelinePatch {
  included?: boolean;
  schedule?: ScheduleBucket;
  isDuplicate?: boolean;
  duplicateOfId?: string | null;
  creditorName?: string;
  balance?: string;
  monthlyPayment?: string;
}

export function patchDemoTradeline(
  matterId: string,
  tradelineId: string,
  patch: TradelinePatch
): DemoTradeline[] {
  const state = getOrCreate(matterId);
  const tl = state.classifiedTradelines.find((t) => t.id === tradelineId);
  if (!tl) return state.classifiedTradelines;

  const previousSchedule = tl.schedule;

  if (patch.schedule !== undefined && patch.schedule !== tl.schedule) {
    tl.schedule = patch.schedule;
    tl.rationale = `Attorney reassigned from Schedule ${previousSchedule} to Schedule ${patch.schedule}`;
  }
  if (patch.creditorName !== undefined) tl.creditorName = patch.creditorName.trim();
  if (patch.balance !== undefined) {
    const amount = parseMoney(patch.balance);
    if (amount) tl.balance = amount;
  }
  if (patch.monthlyPayment !== undefined) {
    const amount = parseMoney(patch.monthlyPayment);
    if (amount) tl.monthlyPayment = amount;
  }
  if (patch.isDuplicate !== undefined) {
    tl.isDuplicate = patch.isDuplicate;
    if (!patch.isDuplicate) delete tl.duplicateOfId;
  }
  if (patch.duplicateOfId !== undefined) {
    if (patch.duplicateOfId) tl.duplicateOfId = patch.duplicateOfId;
    else delete tl.duplicateOfId;
  }
  if (patch.isDuplicate === true) {
    state.tradelineInclusion[tradelineId] = false;
  }
  if (patch.included !== undefined) {
    state.tradelineInclusion[tradelineId] = patch.included;
    if (patch.included && tl.isDuplicate) {
      tl.isDuplicate = false;
      delete tl.duplicateOfId;
    }
  }

  const field = state.reviewFields.find((f) => f.id === `credit-${tradelineId}`);
  if (field) {
    field.formId = formIdForSchedule(tl.schedule);
    field.proposedValue = tl.creditorName;
    if (tl.isDuplicate) {
      field.approvalState = "questioned";
      const dupName = tl.duplicateOfId
        ? state.classifiedTradelines.find((t) => t.id === tl.duplicateOfId)?.creditorName
        : undefined;
      field.rationale = dupName
        ? `Duplicate of ${dupName} — excluded from petition`
        : "Marked duplicate by attorney — excluded from petition";
    } else if (state.tradelineInclusion[tradelineId] === false) {
      field.approvalState = "questioned";
      field.rationale = "Excluded from petition by attorney — credit review";
    } else if (field.approvalState === "questioned") {
      field.approvalState = "pending";
      field.rationale = `${tl.rationale} — Balance $${tl.balance}`;
    } else {
      field.rationale = `${tl.rationale} — Balance $${tl.balance}`;
    }
  }

  recordDemoProvenance(matterId, {
    formFieldId: `credit-${tradelineId}`,
    eventType: "attorney_edited",
    previousValue: previousSchedule,
    newValue: {
      schedule: tl.schedule,
      included: state.tradelineInclusion[tradelineId] !== false,
      isDuplicate: tl.isDuplicate ?? false,
      duplicateOfId: tl.duplicateOfId,
    },
    metadata: { tradelineId, patch, source: "credit_review" },
  });

  recomputeTradelineDiagnostics(state);
  saveSnapshot();
  return state.classifiedTradelines;
}

export interface ManualCreditorInput {
  creditorName: string;
  balance: string;
  schedule: ScheduleBucket;
  accountType?: string;
  monthlyPayment?: string;
  collateralDescription?: string;
}

export function addManualCreditor(matterId: string, input: ManualCreditorInput): DemoTradeline {
  const state = getOrCreate(matterId);
  const id = `manual-${crypto.randomUUID()}`;
  const balance = parseMoney(input.balance) ?? input.balance;
  const monthlyPayment = input.monthlyPayment
    ? (parseMoney(input.monthlyPayment) ?? input.monthlyPayment)
    : undefined;

  const tl: DemoTradeline = {
    id,
    creditorName: input.creditorName.trim(),
    accountType: input.accountType?.trim() || "Manual entry",
    balance,
    monthlyPayment,
    collateralDescription: input.collateralDescription?.trim(),
    schedule: input.schedule,
    confidence: 1,
    rationale: "Added manually by attorney — not on credit report",
    isManual: true,
    isSecured: input.schedule === "D",
    isPriority: input.schedule === "E",
  };

  state.classifiedTradelines.push(tl);
  state.tradelineInclusion[id] = true;

  const field: DemoReviewField = {
    id: `credit-${id}`,
    fieldPath: `creditors.manual.${id}`,
    formId: formIdForSchedule(input.schedule),
    proposedValue: tl.creditorName,
    confidence: 1,
    approvalState: "pending",
    rationale: `Manual creditor (not on credit report) — Balance $${tl.balance}`,
    sourceDocument: { id: "manual-entry", fileName: "Attorney manual entry" },
  };
  state.reviewFields.push(field);

  recordDemoProvenance(matterId, {
    formFieldId: field.id,
    eventType: "attorney_edited",
    newValue: tl.creditorName,
    metadata: {
      tradelineId: id,
      schedule: input.schedule,
      balance: tl.balance,
      source: "manual_creditor",
    },
  });

  recomputeTradelineDiagnostics(state);
  saveSnapshot();
  return tl;
}

export function setTradelineIncluded(
  matterId: string,
  tradelineId: string,
  included: boolean
): DemoTradeline[] {
  return patchDemoTradeline(matterId, tradelineId, { included });
}

function parseMoney(value: string): string | null {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d{1,2})?/);
  return match ? match[0] : null;
}

export function updateDemoScheduleItem(
  matterId: string,
  itemId: string,
  patch: { value?: string; label?: string; description?: string }
): PetitionView {
  const state = getOrCreate(matterId);
  const field = state.reviewFields.find((f) => f.id === itemId);
  if (field) {
    if (patch.label?.trim()) {
      field.lineLabel = patch.label.trim();
    }
    if (patch.value !== undefined) {
      const previous = field.proposedValue;
      field.proposedValue = parseMoney(patch.value) ?? patch.value;
      field.approvalState = "edited";
      recordDemoProvenance(matterId, {
        formFieldId: itemId,
        eventType: "attorney_edited",
        previousValue: previous,
        newValue: field.proposedValue,
        metadata: { source: "schedules_editor", formId: field.formId },
      });
    } else if (patch.label?.trim()) {
      field.approvalState = "edited";
      recordDemoProvenance(matterId, {
        formFieldId: itemId,
        eventType: "attorney_edited",
        newValue: field.proposedValue,
        metadata: { source: "schedules_editor", lineLabel: field.lineLabel },
      });
    }
  } else if (itemId.startsWith("ex-")) {
    const assetId = itemId.slice(3);
    const asset = state.assets.find((a) => a.id === assetId);
    if (asset) {
      if (patch.label?.trim()) asset.description = patch.label.trim();
      if (patch.value !== undefined) {
        const amount = parseMoney(patch.value);
        if (amount) asset.exemptionAmount = amount;
      }
    }
  } else {
    const asset = state.assets.find((a) => a.id === itemId);
    if (asset) {
      if (patch.description?.trim() || patch.label?.trim()) {
        asset.description = (patch.description ?? patch.label)!.trim();
      }
      if (patch.value !== undefined) {
        const amount = parseMoney(patch.value);
        if (amount) asset.currentValue = amount;
        const secured = patch.value.match(/secured:\s*\$?([\d,]+\.?\d*)/i);
        if (secured?.[1]) asset.securedAmount = secured[1].replace(/,/g, "");
      }
      recordDemoProvenance(matterId, {
        formFieldId: itemId,
        eventType: "attorney_edited",
        newValue: asset.currentValue,
        metadata: { source: "schedules_editor", description: asset.description, formId: "106A/B" },
      });
    } else {
      const tl = state.classifiedTradelines.find((t) => t.id === itemId);
      if (tl) {
        if (patch.label?.trim()) tl.creditorName = patch.label.trim();
        if (patch.value !== undefined) {
          const amount = parseMoney(patch.value);
          if (amount) tl.balance = amount;
          const monthly = patch.value.match(/([\d,]+\.?\d*)\/mo/i);
          if (monthly?.[1]) tl.monthlyPayment = monthly[1].replace(/,/g, "");
        }
      }
    }
  }
  recomputeDemoDiagnostics(matterId, {});
  saveSnapshot();
  return assembleDemoPetition(matterId);
}

/** Mark all fields on a schedule form as attorney-approved (values unchanged). */
export function approveDemoScheduleForm(
  matterId: string,
  formId: "106I" | "106J" | "106H" | "107"
): PetitionView {
  const state = getOrCreate(matterId);
  ensureScheduleDefaults(state);
  for (const field of state.reviewFields) {
    if (field.formId !== formId) continue;
    if (field.approvalState === "approved" || field.approvalState === "edited") continue;
    const previousValue = field.proposedValue;
    field.approvalState = "approved";
    recordDemoProvenance(matterId, {
      formFieldId: field.id,
      eventType: "attorney_approved",
      previousValue,
      newValue: field.proposedValue,
      confidence: field.confidence,
      metadata: {
        fieldPath: field.fieldPath,
        formId: field.formId,
        source: "schedule_approve_all",
      },
    });
  }
  recomputeDemoDiagnostics(matterId, {});
  saveSnapshot();
  return assembleDemoPetition(matterId);
}

export interface AddAssetInput {
  description: string;
  category: string;
  currentValue: string;
  securedAmount?: string;
  exemptionSystem?: string;
  exemptionAmount?: string;
}

export function addDemoAsset(matterId: string, input: AddAssetInput): PetitionView {
  const state = getOrCreate(matterId);
  const id = `asset-${crypto.randomUUID()}`;
  const currentValue = parseMoney(input.currentValue) ?? input.currentValue;
  const asset: DemoAsset = {
    id,
    description: input.description.trim(),
    category: input.category,
    currentValue,
    securedAmount: input.securedAmount
      ? (parseMoney(input.securedAmount) ?? input.securedAmount)
      : undefined,
    exemptionSystem: input.exemptionSystem?.trim() || "System 2",
    exemptionAmount: input.exemptionAmount
      ? (parseMoney(input.exemptionAmount) ?? input.exemptionAmount)
      : currentValue,
  };
  state.assets.push(asset);
  recordDemoProvenance(matterId, {
    formFieldId: id,
    eventType: "attorney_edited",
    newValue: asset.currentValue,
    metadata: {
      source: "schedule_asset_add",
      description: asset.description,
      category: asset.category,
      formId: "106A/B",
    },
  });
  recomputeDemoDiagnostics(matterId, {});
  saveSnapshot();
  return assembleDemoPetition(matterId);
}

export interface AddScheduleLineInput {
  formId: "106I" | "106J" | "106H" | "107";
  lineLabel: string;
  amount: string;
}

export interface AddCodebtorInput {
  name: string;
  relationship?: string;
  creditorOrDebt?: string;
}

export function addDemoCodebtor(matterId: string, input: AddCodebtorInput): PetitionView {
  const state = getOrCreate(matterId);
  const id = `h-custom-${crypto.randomUUID()}`;
  const detail = [input.relationship?.trim(), input.creditorOrDebt?.trim()].filter(Boolean).join(" · ");
  const field: DemoReviewField = {
    id,
    fieldPath: `codebtors.${id}`,
    formId: "106H",
    lineLabel: input.name.trim(),
    proposedValue: detail || "Codebtor",
    confidence: 1,
    approvalState: "edited",
    rationale: "Attorney-added Schedule H codebtor",
    sourceDocument: { id: "attorney-entry", fileName: "Attorney schedule entry" },
  };
  state.reviewFields.push(field);
  recordDemoProvenance(matterId, {
    formFieldId: id,
    eventType: "attorney_edited",
    newValue: field.proposedValue,
    metadata: { source: "schedule_codebtor_add", formId: "106H" },
  });
  recomputeDemoDiagnostics(matterId, {});
  saveSnapshot();
  return assembleDemoPetition(matterId);
}

export function addDemoScheduleLine(matterId: string, input: AddScheduleLineInput): PetitionView {
  const state = getOrCreate(matterId);
  const prefix =
    input.formId === "106J" ? "j" : input.formId === "106I" ? "i" : "107";
  const id = `${prefix}-custom-${crypto.randomUUID()}`;
  const value = input.formId === "107" ? input.amount.trim() : (parseMoney(input.amount) ?? input.amount);
  const fieldPathBase =
    input.formId === "106J" ? "expenses" : input.formId === "106I" ? "income" : "sofa";
  const field: DemoReviewField = {
    id,
    fieldPath: `${fieldPathBase}.custom.${id}`,
    formId: input.formId,
    lineLabel: input.lineLabel.trim(),
    proposedValue: value,
    confidence: 1,
    approvalState: "edited",
    rationale: "Attorney-added schedule line",
    sourceDocument: { id: "attorney-entry", fileName: "Attorney schedule entry" },
  };
  state.reviewFields.push(field);
  recordDemoProvenance(matterId, {
    formFieldId: id,
    eventType: "attorney_edited",
    newValue: value,
    metadata: { source: "schedule_line_add", lineLabel: field.lineLabel, formId: input.formId },
  });
  recomputeDemoDiagnostics(matterId, {});
  saveSnapshot();
  return assembleDemoPetition(matterId);
}

const PROTECTED_SCHEDULE_ITEM_IDS = new Set([
  "chapter-election",
  "district-filing",
  "means-computed",
  "placeholder-i",
  "placeholder-j",
  "placeholder-h",
]);

export function removeDemoScheduleItem(matterId: string, itemId: string): PetitionView {
  if (PROTECTED_SCHEDULE_ITEM_IDS.has(itemId)) {
    throw new Error("This schedule item cannot be removed");
  }

  const state = getOrCreate(matterId);
  const assetIdx = state.assets.findIndex((a) => a.id === itemId);
  if (assetIdx >= 0) {
    const removed = state.assets.splice(assetIdx, 1)[0];
    if (removed) {
      recordDemoProvenance(matterId, {
        formFieldId: itemId,
        eventType: "attorney_edited",
        previousValue: removed.currentValue,
        newValue: null,
        metadata: { source: "schedule_asset_remove", description: removed.description },
      });
    }
  } else if (
    itemId.startsWith("j-custom-") ||
    itemId.startsWith("i-custom-") ||
    itemId.startsWith("h-custom-") ||
    itemId.startsWith("107-custom-")
  ) {
    const field = state.reviewFields.find((f) => f.id === itemId);
    state.reviewFields = state.reviewFields.filter((f) => f.id !== itemId);
    recordDemoProvenance(matterId, {
      formFieldId: itemId,
      eventType: "attorney_edited",
      previousValue: field?.proposedValue,
      newValue: null,
      metadata: { source: "schedule_line_remove" },
    });
  } else {
    const tl = state.classifiedTradelines.find((t) => t.id === itemId);
    if (tl?.isManual) {
      state.classifiedTradelines = state.classifiedTradelines.filter((t) => t.id !== itemId);
      state.reviewFields = state.reviewFields.filter((f) => f.id !== `credit-${itemId}`);
      delete state.tradelineInclusion[itemId];
    } else if (tl) {
      throw new Error("Credit tradelines must be excluded on the Credit tab — not deleted");
    } else if (
      !SCHEDULE_J_LINES.some((l) => l.id === itemId) &&
      !SCHEDULE_I_LINES.some((l) => l.id === itemId) &&
      !SOFA_LINES.some((l) => l.id === itemId)
    ) {
      state.reviewFields = state.reviewFields.filter((f) => f.id !== itemId);
    } else {
      throw new Error("Standard form lines cannot be removed — set the amount to $0.00 instead");
    }
  }

  recomputeDemoDiagnostics(matterId, {});
  saveSnapshot();
  return assembleDemoPetition(matterId);
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
    householdSize: input.householdSize ?? state.consult?.householdSize ?? 2,
    annualIncome: input.annualIncome ?? state.consult?.annualIncome ?? "72000.00",
    deductions: {
      ...DEFAULT_DEDUCTIONS,
      livingExpenses:
        state.consult?.monthlyExpenses ||
        sumScheduleJExpenses(state) ||
        DEFAULT_DEDUCTIONS.livingExpenses,
    },
  });

  state.diagnostics = buildDiagnosticsPayload({
    meansTest,
    missingFields: state.reviewFields.filter((f) => f.approvalState === "pending").length,
    exemptionGaps: 0,
    creditSummary: state.creditPulled ? scheduleSummary(getIncludedTradelines(state)) : undefined,
  });

  saveSnapshot();
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

/** Full bankruptcy petition packet for attorney practice / court preview */
export function getFullPacketFormIds(chapter: "7" | "13"): string[] {
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
    chapter === "13" ? "122C-1" : "122A-1",
    chapter === "13" ? "122C-2" : "122A-2",
    "cert-counsel",
    "3015-1.7",
    "MML",
    "341",
    ...(chapter === "13" ? ["3015-1.01"] : []),
  ];
}

export function getApprovedFormIds(matterId: string): string[] {
  const state = getOrCreate(matterId);
  const formIds = new Set<string>();
  for (const field of state.reviewFields) {
    if (field.approvalState === "approved" || field.approvalState === "edited") {
      formIds.add(field.formId);
    }
  }
  if (formIds.size >= state.reviewFields.length && state.reviewFields.length > 0) {
    return getFullPacketFormIds(state.chapter);
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
    state.portal = buildPortal(matterId, state);
  }
  if (state.portal?.counseling.course2.status === "locked") {
    state.portal.counseling.course2.status = "pending";
  }
  const postFiling = buildPostFilingCalendarEvents({
    matterId,
    debtorDisplayName: state.debtorDisplayName,
    chapter: state.chapter,
    filing,
    divisionName: state.divisionName,
  });
  const existingIds = new Set((state.calendarEvents ?? []).map((e) => e.id));
  state.calendarEvents = [
    ...(state.calendarEvents ?? []).filter((e) => e.source !== "filing"),
    ...postFiling.filter((e) => !existingIds.has(e.id)),
  ];
  saveSnapshot();
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
    title: "Photo ID (driver's license or passport)",
    description: "Clear photo of government-issued ID — front and back if applicable",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    status: "open",
  },
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

const COUNSELING_PROVIDER_META: Record<
  string,
  { label: string; url: string }
> = {
  debtorcc: { label: "DebtorCC.org", url: "https://debtorcc.org" },
  bkcert: { label: "BKCert.com (DECAF)", url: "https://www.bkcert.com" },
  advantagecc: { label: "AdvantageCC.org", url: "https://www.advantagecc.org" },
  creditorg: { label: "Credit.org", url: "https://www.credit.org/bankruptcy/" },
};

function buildCounseling(state: DemoMatterState): PortalCounseling {
  const providerKey = state.counselingProvider ?? "debtorcc";
  const meta = COUNSELING_PROVIDER_META[providerKey] ?? COUNSELING_PROVIDER_META.debtorcc!;
  const existing = state.portal?.counseling;
  return {
    tier: state.counselingTier ?? "relay",
    provider: providerKey,
    providerLabel: meta.label,
    providerUrl: meta.url,
    course1: existing?.course1 ?? { status: "pending" },
    course2: existing?.course2 ?? {
      status: state.filing ? "pending" : "locked",
    },
  };
}

function buildPortal(matterId: string, state: DemoMatterState): DemoPortalState {
  const counseling = buildCounseling(state);
  return {
    token: portalTokenForMatter(matterId),
    matterId,
    debtorName: state.debtorDisplayName,
    chapter: state.chapter,
    caseNumber: state.filing?.caseNumber,
    requests: state.portal?.requests ?? DEFAULT_PORTAL_REQUESTS.map((r, i) => ({
      ...r,
      id: `req-${i + 1}`,
    })),
    message: state.filing
      ? "Your case has been filed. Complete Course 2 (debtor education) and upload any remaining documents."
      : "Welcome — complete Course 1 (credit counseling) and upload documents so your attorney can file.",
    counseling,
    filed: !!state.filing,
  };
}

export function resolvePortalMatterId(token: string): string | null {
  const verified = verifyPortalToken(token);
  return verified?.matterId ?? null;
}

export function isDemoPortalToken(token: string): boolean {
  return resolvePortalMatterId(token) !== null;
}

export function getSecurePortalUrl(matterId: string, webBase: string): string {
  const token = portalTokenForMatter(matterId);
  return `${webBase.replace(/\/$/, "")}/portal/${token}`;
}

export function getDemoPortal(token: string): DemoPortalState {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) throw new Error("Invalid or expired portal link");
  const state = getOrCreate(matterId);
  state.portal = buildPortal(matterId, state);
  saveSnapshot();
  return state.portal;
}

export function getDemoPortalOpenCount(matterId: string): number {
  const token = portalTokenForMatter(matterId);
  const portal = getDemoPortal(token);
  return portal.requests.filter((r) => r.status === "open").length;
}

export function submitPortalUpload(
  token: string,
  requestId: string,
  fileName: string,
  documentType?: string
): PortalDocumentRequest | null {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return null;
  const state = getOrCreate(matterId);
  const portal = getDemoPortal(token);
  const req = portal.requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = "uploaded";
  req.uploadedFileName = fileName;
  state.portal = portal;

  const docType = documentType ?? inferDocumentType(fileName, req.title);
  addIntakeDocument(matterId, {
    fileName,
    documentType: docType,
    uploadedBy: "client",
    source: "portal",
    requestId,
  });

  recordPortalRequestUploadActivity(matterId, req.title, fileName);

  saveSnapshot();
  return req;
}

export function completePortalRequest(
  token: string,
  requestId: string
): PortalDocumentRequest | null {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return null;
  const state = getOrCreate(matterId);
  const portal = getDemoPortal(token);
  const req = portal.requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = "complete";
  state.portal = portal;
  saveSnapshot();
  return req;
}

export function completeCounselingCourse(
  token: string,
  course: 1 | 2,
  input?: { certificateFileName?: string; certificateNumber?: string; simulateGold?: boolean }
): DemoPortalState | null {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return null;
  const state = getOrCreate(matterId);
  const portal = getDemoPortal(token);
  const target = course === 1 ? portal.counseling.course1 : portal.counseling.course2;
  if (target.status === "locked") return null;
  target.status = "complete";
  target.completedAt = new Date().toISOString();
  target.certificateFileName =
    input?.certificateFileName ?? `counseling_course_${course}_${Date.now()}.pdf`;
  target.certificateNumber =
    input?.certificateNumber ?? `CERT-${course}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  if (course === 1) {
    recordDemoProvenance(matterId, {
      formFieldId: "cert-counsel",
      eventType: "attorney_approved",
      newValue: target.certificateNumber,
      metadata: {
        source: input?.simulateGold ? "counseling_gold_webhook" : "counseling_vault",
        completedAt: target.completedAt,
        fileName: target.certificateFileName,
        tier: portal.counseling.tier,
      },
    });
  } else {
    recordDemoProvenance(matterId, {
      formFieldId: "cert-education",
      eventType: "attorney_approved",
      newValue: target.certificateNumber,
      metadata: {
        source: "counseling_vault",
        completedAt: target.completedAt,
        fileName: target.certificateFileName,
      },
    });
  }

  state.portal = portal;
  if (state.filing && portal.counseling.course2.status === "locked") {
    portal.counseling.course2.status = "pending";
  }
  saveSnapshot();
  return portal;
}

export function setMatterCounselingConfig(
  matterId: string,
  config: { tier?: "gold" | "relay" | "vault"; provider?: string }
): void {
  const state = getOrCreate(matterId);
  if (config.tier) state.counselingTier = config.tier;
  if (config.provider) state.counselingProvider = config.provider;
  if (state.portal) state.portal = buildPortal(matterId, state);
  saveSnapshot();
}

export function getDemoBilling(matterId: string): MatterInvoice | undefined {
  return getOrCreate(matterId).billing;
}

export function setDemoBilling(matterId: string, invoice: MatterInvoice): MatterInvoice {
  const state = getOrCreate(matterId);
  state.billing = invoice;
  return invoice;
}

function inferDocumentType(fileName: string, requestTitle?: string): string {
  const hay = `${fileName} ${requestTitle ?? ""}`.toLowerCase();
  if (hay.includes("license") || hay.includes("passport") || hay.includes("photo id") || hay.includes(" id")) {
    return "drivers_license";
  }
  if (hay.includes("pay") || hay.includes("stub") || hay.includes("wage")) return "paystub";
  if (hay.includes("bank") || hay.includes("statement")) return "bank_statement";
  if (hay.includes("tax") || hay.includes("1040") || hay.includes("return")) return "tax_return";
  return "other";
}

export function addIntakeDocument(
  matterId: string,
  input: {
    id?: string;
    fileName: string;
    documentType?: string;
    uploadedBy: "client" | "attorney";
    source: IntakeDocument["source"];
    requestId?: string;
    mimeType?: string;
    storageKey?: string;
    sha256?: string;
    sizeBytes?: number;
    stored?: boolean;
  }
): IntakeDocument {
  const state = getOrCreate(matterId);
  const doc: IntakeDocument = {
    id: input.id ?? `doc-${crypto.randomUUID().slice(0, 8)}`,
    fileName: input.fileName,
    documentType: input.documentType ?? inferDocumentType(input.fileName),
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy,
    source: input.source,
    requestId: input.requestId,
    status: "received",
    mimeType: input.mimeType,
    storageKey: input.storageKey,
    sha256: input.sha256,
    sizeBytes: input.sizeBytes,
    stored: input.stored,
  };
  state.intakeDocuments.push(doc);
  saveSnapshot();
  return doc;
}

export function getIntakeDocument(
  matterId: string,
  documentId: string
): IntakeDocument | null {
  const state = getOrCreate(matterId);
  return state.intakeDocuments.find((d) => d.id === documentId) ?? null;
}

export function addMatterNote(
  matterId: string,
  input: { text: string; source?: MatterNote["source"]; authorLabel?: string }
): MatterNote {
  const state = getOrCreate(matterId);
  const note: MatterNote = {
    id: `note-${crypto.randomUUID().slice(0, 8)}`,
    text: input.text.trim(),
    source: input.source ?? "attorney",
    createdAt: new Date().toISOString(),
    authorLabel: input.authorLabel ?? FIRM_ATTORNEY_NAME,
  };
  state.notes.unshift(note);
  recordDemoProvenance(matterId, {
    formFieldId: `note-${note.id}`,
    eventType: "attorney_edited",
    newValue: note.text,
    metadata: { source: note.source, type: "matter_note" },
  });
  saveSnapshot();
  return note;
}

export function getMatterNotes(matterId: string): MatterNote[] {
  return getOrCreate(matterId).notes;
}

export function getIntakeDossier(matterId: string): {
  documents: IntakeDocument[];
  notes: MatterNote[];
  consult?: ConsultSnapshot;
  pendingApplyCount: number;
  intakeProfile: {
    debtorDisplayName: string;
    chapter: "7" | "13";
    clientEmail?: string;
    clientPhone?: string;
    clientFirstName?: string;
    clientLastName?: string;
  };
} {
  const state = getOrCreate(matterId);
  const pendingApplyCount = countPendingForgeApply(state);
  return {
    documents: state.intakeDocuments,
    notes: state.notes,
    consult: state.consult,
    pendingApplyCount,
    intakeProfile: {
      debtorDisplayName: state.debtorDisplayName,
      chapter: state.chapter,
      clientEmail: state.clientEmail,
      clientPhone: state.clientPhone,
      clientFirstName: state.clientFirstName,
      clientLastName: state.clientLastName,
    },
  };
}

export function saveConsultSnapshot(
  matterId: string,
  input: Omit<ConsultSnapshot, "evaluatedAt" | "recommendation" | "meansTestStatus" | "recommendationRationale" | "presumptionOfAbuse"> & {
    evaluate?: boolean;
  }
): ConsultSnapshot {
  const state = getOrCreate(matterId);
  if (input.debtorName.trim()) {
    state.debtorDisplayName = input.debtorName.trim();
  }
  if (input.chapterPreference !== "undecided") {
    state.chapter = input.chapterPreference;
  }

  const snapshot: ConsultSnapshot = {
    debtorName: input.debtorName,
    householdSize: input.householdSize,
    annualIncome: input.annualIncome,
    monthlyExpenses: input.monthlyExpenses,
    securedDebt: input.securedDebt,
    unsecuredDebt: input.unsecuredDebt,
    chapterPreference: input.chapterPreference,
    takeCase: input.takeCase,
    attorneyNotes: input.attorneyNotes,
  };

  if (input.evaluate !== false) {
    const livingExpenses = input.monthlyExpenses || "3200.00";
    const securedPayments = input.securedDebt
      ? (parseFloat(parseMoney(input.securedDebt) ?? "0") / 12).toFixed(2)
      : DEFAULT_DEDUCTIONS.securedDebtPayments;

    const meansTest = evaluateUnifiedMeansTest({
      chapter: input.chapterPreference === "13" ? "13" : "7",
      householdSize: input.householdSize,
      annualIncome: input.annualIncome,
      deductions: {
        ...DEFAULT_DEDUCTIONS,
        livingExpenses,
        securedDebtPayments: securedPayments,
      },
    });

    snapshot.evaluatedAt = new Date().toISOString();
    snapshot.recommendation = meansTest.recommendation;
    snapshot.meansTestStatus = meansTest.meansTestStatus;
    snapshot.recommendationRationale = meansTest.recommendationRationale;
    snapshot.presumptionOfAbuse = meansTest.presumptionOfAbuse;

    state.diagnostics = buildDiagnosticsPayload({
      meansTest,
      missingFields: state.reviewFields.filter((f) => f.approvalState === "pending").length,
      exemptionGaps: 0,
      creditSummary: state.creditPulled
        ? scheduleSummary(getIncludedTradelines(state))
        : undefined,
    });
  }

  state.consult = snapshot;
  saveSnapshot();
  return snapshot;
}

function splitDebtorName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { first: "Debtor", last: "Unknown" };
  if (parts.length === 1) return { first: parts[0]!, last: parts[0]! };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

function upsertReviewField(
  state: DemoMatterState,
  matterId: string,
  spec: {
    id: string;
    fieldPath: string;
    formId: string;
    value: unknown;
    confidence: number;
    rationale: string;
    sourceDocument: { id: string; fileName: string };
  }
): string {
  let field = state.reviewFields.find((f) => f.id === spec.id);
  if (!field) {
    field = {
      id: spec.id,
      fieldPath: spec.fieldPath,
      formId: spec.formId,
      proposedValue: spec.value,
      confidence: spec.confidence,
      approvalState: "pending",
      rationale: spec.rationale,
      sourceDocument: spec.sourceDocument,
    };
    state.reviewFields.push(field);
  } else {
    field.proposedValue = spec.value;
    field.approvalState = "pending";
    field.rationale = spec.rationale;
    field.sourceDocument = spec.sourceDocument;
  }

  recordDemoProvenance(matterId, {
    formFieldId: spec.id,
    eventType: "ai_extracted",
    newValue: spec.value,
    confidence: spec.confidence,
    metadata: {
      fieldPath: spec.fieldPath,
      formId: spec.formId,
      sourceFile: spec.sourceDocument.fileName,
      via: "forge_sync",
    },
  });

  return spec.id;
}

export function applyPendingIntake(matterId: string): {
  appliedCount: number;
  creditAppliedCount: number;
  fieldIds: string[];
  message: string;
} {
  const state = getOrCreate(matterId);
  const pending = state.intakeDocuments.filter((d) => d.status !== "applied");
  const fieldIds: string[] = [];

  for (const doc of pending) {
    const src = { id: doc.id, fileName: doc.fileName };
    const applied: string[] = [];

    if (doc.documentType === "drivers_license") {
      const extracted = extractIdentityFromDocument(doc.fileName, doc.documentType);
      let first: string;
      let last: string;
      if (extracted.confidence >= 0.5 && extracted.firstName && extracted.lastName) {
        first = extracted.firstName;
        last = extracted.lastName;
      } else {
        const name = state.consult?.debtorName ?? state.debtorDisplayName;
        ({ first, last } = splitDebtorName(name.includes(" ") ? name : name));
      }
      applied.push(
        upsertReviewField(state, matterId, {
          id: "f1",
          fieldPath: "debtor1.firstName",
          formId: "101",
          value: first,
          confidence: 0.96,
          rationale: `Extracted from ${doc.fileName} — ID OCR`,
          sourceDocument: src,
        }),
        upsertReviewField(state, matterId, {
          id: "f2",
          fieldPath: "debtor1.lastName",
          formId: "101",
          value: last,
          confidence: 0.96,
          rationale: `Extracted from ${doc.fileName} — ID OCR`,
          sourceDocument: src,
        })
      );
    } else if (doc.documentType === "paystub") {
      const monthly =
        state.consult?.annualIncome
          ? (parseFloat(parseMoney(state.consult.annualIncome) ?? "72000") / 12).toFixed(2)
          : "6000.00";
      applied.push(
        upsertReviewField(state, matterId, {
          id: "f3",
          fieldPath: "debtor1MonthlyIncome",
          formId: "106I",
          value: monthly,
          confidence: 0.93,
          rationale: `Gross monthly from ${doc.fileName}`,
          sourceDocument: src,
        })
      );
    } else if (doc.documentType === "bank_statement") {
      if (!state.assets.find((a) => a.id === "checking")) {
        state.assets.push({
          id: "checking",
          description: "Checking account — from client upload",
          category: "cash",
          currentValue: "1250.00",
          exemptionSystem: "Wildcard",
          exemptionAmount: "1250.00",
        });
      }
      applied.push(
        upsertReviewField(state, matterId, {
          id: "f-bank",
          fieldPath: "assets.checking",
          formId: "106A/B",
          value: "1250.00",
          confidence: 0.88,
          rationale: `Balance from ${doc.fileName}`,
          sourceDocument: src,
        })
      );
    } else if (doc.documentType === "tax_return") {
      applied.push(
        upsertReviewField(state, matterId, {
          id: "f-tax",
          fieldPath: "income.taxReturnYear",
          formId: "106I",
          value: "2024",
          confidence: 0.9,
          rationale: `Tax year from ${doc.fileName}`,
          sourceDocument: src,
        })
      );
    }

    doc.status = "applied";
    doc.appliedFieldIds = applied;
    fieldIds.push(...applied);
  }

  const creditResult = applyPendingCreditToPetition(matterId, state);
  fieldIds.push(...creditResult.fieldIds);

  if (state.consult) {
    recomputeDemoDiagnostics(matterId, {
      householdSize: state.consult.householdSize,
      annualIncome: state.consult.annualIncome,
      chapter: state.consult.chapterPreference === "13" ? "13" : "7",
    });
  } else {
    recomputeDemoDiagnostics(matterId, {});
  }

  if (pending.length > 0) {
    addMatterNote(matterId, {
      text: `Apply to petition — ${pending.length} document(s) — ${fieldIds.length - creditResult.fieldIds.length} petition field(s) updated`,
      source: "system",
      authorLabel: "Apply to Petition",
    });
  }

  saveSnapshot();

  const messageParts: string[] = [];
  if (pending.length > 0) {
    messageParts.push(`Synced ${pending.length} document(s) into the petition`);
  }
  if (creditResult.approvedCount > 0) {
    messageParts.push(
      `Added ${creditResult.approvedCount} credit tradeline(s) to schedules D–G`
    );
  }

  return {
    appliedCount: pending.length,
    creditAppliedCount: creditResult.approvedCount,
    fieldIds,
    message:
      messageParts.length === 0
        ? "Nothing to apply — upload documents or pull tri-merge credit first"
        : messageParts.join(" · "),
  };
}

function buildIntakeAttorneyNotes(input: {
  clientEmail?: string;
  clientPhone?: string;
  chapter?: "7" | "13";
}): string {
  const lines = ["New matter intake — auto-captured at open."];
  if (input.clientEmail) lines.push(`Client email: ${input.clientEmail}`);
  if (input.clientPhone) lines.push(`Client phone: ${input.clientPhone}`);
  if (input.chapter) lines.push(`Chapter preference: Chapter ${input.chapter}`);
  return lines.join("\n");
}

/** Pull everything from New Matter form into Scout + petition fields */
function seedNewMatterFromIntake(
  matterId: string,
  input: {
    debtorDisplayName: string;
    chapter?: "7" | "13";
    clientEmail?: string;
    clientPhone?: string;
    clientFirstName?: string;
    clientLastName?: string;
  }
): void {
  const state = getOrCreate(matterId);
  const first =
    input.clientFirstName?.trim() || splitDebtorName(input.debtorDisplayName).first;
  const last =
    input.clientLastName?.trim() || splitDebtorName(input.debtorDisplayName).last;
  const debtorName = `${first} ${last}`.trim() || input.debtorDisplayName.trim();
  const chapter = input.chapter ?? "7";
  const src = { id: "intake-new-matter", fileName: "New Matter intake form" };

  state.debtorDisplayName = debtorName;
  state.chapter = chapter;

  state.consult = {
    debtorName,
    householdSize: 1,
    annualIncome: "",
    monthlyExpenses: "",
    securedDebt: "",
    unsecuredDebt: "",
    chapterPreference: chapter,
    takeCase: null,
    attorneyNotes: buildIntakeAttorneyNotes(input),
  };

  upsertReviewField(state, matterId, {
    id: "f1",
    fieldPath: "debtor1.firstName",
    formId: "101",
    value: first,
    confidence: 1,
    rationale: "Captured from New Matter — client first name",
    sourceDocument: src,
  });
  upsertReviewField(state, matterId, {
    id: "f2",
    fieldPath: "debtor1.lastName",
    formId: "101",
    value: last,
    confidence: 1,
    rationale: "Captured from New Matter — client last name",
    sourceDocument: src,
  });

  if (input.clientEmail?.trim()) {
    upsertReviewField(state, matterId, {
      id: "f-contact-email",
      fieldPath: "debtor1.email",
      formId: "101",
      value: input.clientEmail.trim(),
      confidence: 1,
      rationale: "Captured from New Matter — client email (portal & notices)",
      sourceDocument: src,
    });
  }

  if (input.clientPhone?.trim()) {
    upsertReviewField(state, matterId, {
      id: "f-contact-phone",
      fieldPath: "debtor1.homePhone",
      formId: "101",
      value: input.clientPhone.trim(),
      confidence: 1,
      rationale: "Captured from New Matter — client phone",
      sourceDocument: src,
    });
  }

  state.notes.unshift({
    id: `note-intake-${crypto.randomUUID().slice(0, 8)}`,
    text: `Intake opened for ${debtorName}${input.clientEmail ? ` · ${input.clientEmail}` : ""}${input.clientPhone ? ` · ${input.clientPhone}` : ""}`,
    source: "system",
    authorLabel: "New Matter",
    createdAt: new Date().toISOString(),
  });

  state.portal = buildPortal(matterId, state);
}

export function createDemoMatter(input: {
  debtorDisplayName: string;
  chapter?: "7" | "13";
  county?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientFirstName?: string;
  clientLastName?: string;
}): DemoMatterSummary {
  const matterId = `demo-${crypto.randomUUID().slice(0, 8)}`;
  const state = buildProspectState(matterId, input);
  if (input.clientEmail) state.clientEmail = input.clientEmail.trim();
  if (input.clientPhone) state.clientPhone = input.clientPhone.trim();
  if (input.clientFirstName) state.clientFirstName = input.clientFirstName.trim();
  if (input.clientLastName) state.clientLastName = input.clientLastName.trim();
  demoStore.set(matterId, state);
  seedNewMatterFromIntake(matterId, input);
  state.calendarEvents = buildIntakeCalendarEvents({
    matterId,
    debtorDisplayName: getOrCreate(matterId).debtorDisplayName,
    createdAt: state.createdAt,
  });
  saveSnapshot();
  return summarizeDemoMatter(getOrCreate(matterId));
}

function summarizeDemoMatter(state: DemoMatterState): DemoMatterSummary {
  const pending = state.reviewFields.filter((f) => f.approvalState === "pending").length;
  const fields = state.reviewFields;
  const balanceDue = state.billing?.balanceDue ?? "2908.00";
  const paidInFull = parseFloat(balanceDue) <= 0;
  const petition = assembleDemoPetition(state.matterId);
  const counselingComplete = state.portal?.counseling.course1.status === "complete";
  const pendingIntake = state.intakeDocuments.filter((d) => d.status !== "applied").length;
  const portalOpen = state.portalMessages.filter(
    (m) => m.direction === "inbound" && !m.readAt
  ).length;

  const progress = computeMatterProgress({
    matterId: state.matterId,
    chapter: state.chapter,
    debtorDisplayName: state.debtorDisplayName,
    intakeComplete: fields.length > 0,
    reviewComplete: pending === 0 && fields.length > 0,
    pendingFieldCount: pending,
    creditPulled: state.creditPulled,
    preflightReady: pending === 0 && fields.length > 0 && counselingComplete,
    filed: !!state.filing,
    autopilotActive: !!state.autopilot,
    clientPortalRequestsOpen: portalOpen,
    balanceDue,
    petitionCompletionPercent: petition.overallCompletion,
    districtConfigured: true,
    counselingComplete,
    consultComplete: !!state.consult?.evaluatedAt,
    pendingIntakeCount: pendingIntake,
  });

  let currentPhase: DemoMatterSummary["currentPhase"] = "consult";
  if (state.filing) currentPhase = "post-filing";
  else if (progress.readyToFile) currentPhase = "file";
  else if (state.consult?.evaluatedAt) currentPhase = "prep";

  const contactCandidates: Array<{ at: string; kind: "portal" | "note" }> = [];
  for (const n of state.notes) contactCandidates.push({ at: n.createdAt, kind: "note" });
  for (const m of state.portalMessages) {
    contactCandidates.push({ at: m.createdAt, kind: "portal" });
  }
  contactCandidates.sort((a, b) => b.at.localeCompare(a.at));
  const last = contactCandidates[0];

  const discharged =
    !!state.dischargeFollowUp?.sentAt ||
    state.autopilot?.tasks.some((t) => t.id === "discharge-track" && t.status === "completed");

  const retained = state.consult?.takeCase === "yes" || !!state.filing;
  let lifecycleStage: DemoMatterSummary["lifecycleStage"] = "potential";
  if (discharged) lifecycleStage = "completed";
  else if (retained) lifecycleStage = "active";

  return {
    matterId: state.matterId,
    debtorDisplayName: state.debtorDisplayName,
    chapter: state.chapter,
    status: state.filing ? "filed" : state.consult?.takeCase === "yes" ? "active" : "prospect",
    consultComplete: !!state.consult?.evaluatedAt,
    pendingDocuments: pendingIntake,
    noteCount: state.notes.length,
    unreadPortalMessages: portalOpen,
    createdAt: state.createdAt,
    clientEmail: state.clientEmail,
    clientPhone: state.clientPhone,
    clientFirstName: state.clientFirstName,
    clientLastName: state.clientLastName,
    overallPercent: progress.overallPercent,
    currentPhase,
    currentStep: progress.nextAction?.title ?? progress.tagline,
    balanceDue,
    paidInFull,
    lifecycleStage,
    lastContactAt: last?.at,
    lastContactKind: last?.kind,
    county: state.county,
    divisionName: state.divisionName,
  };
}

/** Fake client email for discharge / PI follow-up testing (no real mail unless Resend configured) */
export const DEMO_TEST_CLIENT_EMAIL = "maria.test@example.com";

function syncSandboxCreditToState(state: DemoMatterState, approveFields = false): void {
  if (state.creditPulled && state.classifiedTradelines.length > 0) return;
  const classified = classifyCreditTradelines(SANDBOX_TRADELINES);
  const creditFields: DemoReviewField[] = classified.map((tl, i) => ({
    id: `credit-${tl.id}`,
    fieldPath: `creditors.${i}.creditorName`,
    formId: formIdForSchedule(tl.schedule),
    proposedValue: tl.creditorName,
    confidence: tl.confidence,
    approvalState: approveFields ? ("approved" as const) : ("pending" as const),
    rationale: `${tl.rationale} — Balance $${tl.balance}`,
    sourceDocument: { id: "credit-report", fileName: "tri_merge_credit_report.pdf" },
  }));
  state.reviewFields = [...state.reviewFields, ...creditFields];
  state.classifiedTradelines = classified;
  for (const tl of classified) {
    state.tradelineInclusion[tl.id] = true;
  }
  state.creditPulled = true;
  recomputeTradelineDiagnostics(state);
}

function seedFiledTestMatter(): void {
  const matterId = "demo-filed";
  const state = buildInitialState(matterId);
  state.debtorDisplayName = "Martinez, Maria (TEST — filed)";
  state.createdAt = "2025-03-01T00:00:00.000Z";

  for (const field of state.reviewFields) {
    field.approvalState = "approved";
  }
  syncSandboxCreditToState(state, true);

  state.consult = {
    debtorName: "Maria Martinez",
    householdSize: 2,
    annualIncome: "52000.00",
    monthlyExpenses: "3200.00",
    securedDebt: "18500.00",
    unsecuredDebt: "42000.00",
    chapterPreference: "7",
    takeCase: "yes",
    attorneyNotes: "Test matter — Ch 7 recommended, filed for Post-Filing / discharge follow-up testing.",
    evaluatedAt: "2025-03-02T00:00:00.000Z",
    recommendation: "chapter_7",
    meansTestStatus: "pass",
    recommendationRationale: "Below median income — presumption of abuse does not apply.",
    presumptionOfAbuse: false,
  };

  state.intakeDocuments = [
    {
      id: "intake-paystub",
      fileName: "paystub_march_2025.pdf",
      documentType: "pay_stub",
      uploadedAt: "2025-03-03T00:00:00.000Z",
      uploadedBy: "client",
      source: "portal",
      status: "applied",
      appliedFieldIds: [],
    },
    {
      id: "intake-id",
      fileName: "drivers_license.jpg",
      documentType: "photo_id",
      uploadedAt: "2025-03-03T00:00:00.000Z",
      uploadedBy: "client",
      source: "portal",
      status: "applied",
    },
  ];

  const filedAt = new Date();
  filedAt.setUTCDate(filedAt.getUTCDate() - 95);
  const filingDate = filedAt.toISOString().slice(0, 10);

  state.filing = {
    jobId: "job-demo-filed-sandbox",
    matterId,
    status: "filed",
    mode: "sandbox",
    caseNumber: "2:25-bk-12345",
    filedAt: filedAt.toISOString(),
    receiptNumber: "SANDBOX-RECEIPT-DEMO-FILED",
    receiptUrl: undefined,
    documentsFiled: 16,
    district: "CACB",
    message: "Sandbox filing — use this matter to test Post-Filing and discharge + PI follow-up.",
  };

  state.autopilot = generateTimeline({
    matterId,
    caseNumber: state.filing.caseNumber,
    chapter: state.chapter,
    filingDate,
  });

  state.calendarEvents = [
    ...buildIntakeCalendarEvents({
      matterId,
      debtorDisplayName: state.debtorDisplayName,
      createdAt: state.createdAt,
    }),
    ...buildPostFilingCalendarEvents({
      matterId,
      debtorDisplayName: state.debtorDisplayName,
      chapter: state.chapter,
      filing: state.filing,
      divisionName: state.divisionName,
    }),
  ];

  state.clientEmail = DEMO_TEST_CLIENT_EMAIL;
  state.clientPhone = "(909) 555-0199";

  const dischargeTask = state.autopilot?.tasks.find((t) => t.id === "discharge-track");
  if (dischargeTask) {
    dischargeTask.status = "completed";
    dischargeTask.completedAt = new Date().toISOString();
  }
  state.dischargeFollowUp = {
    clientEmail: DEMO_TEST_CLIENT_EMAIL,
    includePiCrossSell: true,
    sentAt: new Date().toISOString(),
    emailOk: true,
  };

  state.billing = generateInvoice({
    matterId,
    chapter: state.chapter,
    paidAmount: "1500.00",
  });

  state.portalMessages = [
    {
      id: "msg-test-inbound",
      direction: "inbound",
      body: "Hi — I finished Course 2. When will I get my discharge?",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  state.notes = [
    {
      id: "note-test-email",
      text: `TEST client email for discharge follow-up: ${DEMO_TEST_CLIENT_EMAIL}`,
      source: "system",
      createdAt: new Date().toISOString(),
      authorLabel: "Demo seed",
    },
    {
      id: "note-filed",
      text: "Sandbox filed ~95 days ago — discharge track task should be due/overdue on Post-Filing.",
      source: "system",
      createdAt: new Date().toISOString(),
      authorLabel: "Demo seed",
    },
  ];

  state.portal = buildPortal(matterId, state);
  state.portal.counseling.course1 = {
    status: "complete",
    completedAt: "2025-03-05T00:00:00.000Z",
    certificateNumber: "DEMO-C1-12345",
  };
  state.portal.counseling.course2 = { status: "complete", completedAt: new Date().toISOString() };

  demoStore.set(matterId, state);
}

function seedIntakeTestMatter(): void {
  const matterId = "demo-intake";
  const state = buildProspectState(matterId, {
    debtorDisplayName: "Johnson, Robert (TEST — intake)",
    chapter: "7",
    county: "Orange",
  });
  state.createdAt = "2025-06-10T00:00:00.000Z";

  state.intakeDocuments = [
    {
      id: "intake-w2",
      fileName: "w2_2024.pdf",
      documentType: "tax_w2",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "client",
      source: "portal",
      status: "received",
    },
    {
      id: "intake-bank",
      fileName: "bank_statement_may.pdf",
      documentType: "bank_statement",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "client",
      source: "portal_general",
      status: "received",
    },
  ];

  state.portalMessages = [
    {
      id: "msg-intake-inbound",
      direction: "inbound",
      body: "I uploaded my W-2 and bank statement — what else do you need?",
      createdAt: new Date().toISOString(),
    },
  ];

  state.notes = [
    {
      id: "note-intake",
      text: "TEST matter — run Initial Consult, then Apply to Petition from File Upload.",
      source: "system",
      createdAt: new Date().toISOString(),
      authorLabel: "Demo seed",
    },
  ];

  state.portal = buildPortal(matterId, state);
  state.clientEmail = "robert.johnson@example.com";
  state.clientPhone = "(714) 555-0200";
  demoStore.set(matterId, state);
}

/** Pre-seed predictable test matters for staging / demo deploys */
export function ensureTestDemoMatters(): void {
  if (!demoStore.has("demo-filed")) seedFiledTestMatter();
  if (!demoStore.has("demo-intake")) seedIntakeTestMatter();

  const filed = demoStore.get("demo-filed");
  if (filed) {
    if (!filed.clientPhone) filed.clientPhone = "(909) 555-0199";
    if (!filed.clientEmail) filed.clientEmail = DEMO_TEST_CLIENT_EMAIL;
    const dischargeTask = filed.autopilot?.tasks.find((t) => t.id === "discharge-track");
    if (dischargeTask && dischargeTask.status !== "completed") {
      dischargeTask.status = "completed";
      dischargeTask.completedAt = new Date().toISOString();
    }
    if (!filed.dischargeFollowUp?.sentAt) {
      filed.dischargeFollowUp = {
        clientEmail: filed.clientEmail ?? DEMO_TEST_CLIENT_EMAIL,
        includePiCrossSell: true,
        sentAt: new Date().toISOString(),
        emailOk: true,
      };
    }
  }

  for (const state of demoStore.values()) {
    ensureDemoContactDefaults(state);
  }
  saveSnapshot();
}

export function movePendingIntakeDocuments(fromMatterId: string, toMatterId: string): number {
  const from = getOrCreate(fromMatterId);
  getOrCreate(toMatterId);
  const pending = from.intakeDocuments.filter((d) => d.status !== "applied");
  if (pending.length === 0) return 0;

  const to = getOrCreate(toMatterId);
  from.intakeDocuments = from.intakeDocuments.filter((d) => d.status === "applied");
  to.intakeDocuments.push(...pending.map((d) => ({ ...d })));

  addMatterNote(toMatterId, {
    text: `Moved ${pending.length} document(s) here — identity matched ${to.debtorDisplayName}`,
    source: "system",
    authorLabel: "Smart match",
  });
  addMatterNote(fromMatterId, {
    text: `Pending uploads moved to ${to.debtorDisplayName}'s file (identity match)`,
    source: "system",
    authorLabel: "Smart match",
  });
  saveSnapshot();
  return pending.length;
}

/** All matters in demo store (includes user-created) */
export function listAllDemoMatterSummaries(): DemoMatterSummary[] {
  getOrCreate("demo");
  return Array.from(demoStore.values())
    .map(summarizeDemoMatter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function previewIntakeUpload(
  matterId: string,
  fileName: string,
  documentType?: string
): UploadMatchPreview {
  return buildUploadMatchPreview(listAllDemoMatterSummaries(), matterId, fileName, documentType);
}

export function previewForgeSyncIdentity(matterId: string): UploadMatchPreview | null {
  const state = getOrCreate(matterId);
  const pending = state.intakeDocuments.filter(
    (d) =>
      d.status !== "applied" &&
      d.source !== "portal" &&
      d.source !== "portal_general" &&
      d.source !== "test_csv"
  );
  for (const doc of pending) {
    const preview = previewIntakeUpload(matterId, doc.fileName, doc.documentType);
    if (preview.action === "confirm") return preview;
  }
  return null;
}

export function listDemoMatters(): DemoMatterSummary[] {
  return listAllDemoMatterSummaries();
}

export function submitPortalGeneralUpload(
  token: string,
  fileName: string,
  documentType?: string
): IntakeDocument | null {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return null;

  const doc = addIntakeDocument(matterId, {
    fileName,
    documentType,
    uploadedBy: "client",
    source: "portal_general",
  });

  recordPortalGeneralUploadActivity(matterId, fileName);
  return doc;
}

export function recordPortalRequestUploadActivity(
  matterId: string,
  title: string,
  fileName: string
): void {
  addMatterNote(matterId, {
    text: `Client uploaded: ${title} (${fileName})`,
    source: "system",
    authorLabel: "Client Portal",
  });
  const state = getOrCreate(matterId);
  state.portalActivity.unshift({
    id: `act-${crypto.randomUUID().slice(0, 8)}`,
    alertType: "document_uploaded",
    body: `${title}: ${fileName}`,
    createdAt: new Date().toISOString(),
  });
  saveSnapshot();
}

export function recordPortalGeneralUploadActivity(matterId: string, fileName: string): void {
  addMatterNote(matterId, {
    text: `Client uploaded additional file: ${fileName}`,
    source: "system",
    authorLabel: "Client Portal",
  });
  const state = getOrCreate(matterId);
  state.portalActivity.unshift({
    id: `act-${crypto.randomUUID().slice(0, 8)}`,
    alertType: "document_uploaded",
    body: `Additional upload: ${fileName}`,
    createdAt: new Date().toISOString(),
  });
  saveSnapshot();
}

export function markPortalRequestUploaded(
  token: string,
  requestId: string,
  fileName: string
): PortalDocumentRequest | null {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return null;
  const state = getOrCreate(matterId);
  const portal = getDemoPortal(token);
  const req = portal.requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = "uploaded";
  req.uploadedFileName = fileName;
  state.portal = portal;
  saveSnapshot();
  return req;
}

export function getPortalStaffData(matterId: string) {
  const state = getOrCreate(matterId);
  return {
    messages: state.portalMessages,
    activity: state.portalActivity,
    portalUrl: getSecurePortalUrl(matterId, process.env.WEB_URL ?? "http://localhost:3000"),
  };
}

export function addPortalStaffMessage(
  matterId: string,
  input: { body: string; direction: "inbound" | "outbound"; staffAuthor?: string }
): PortalMessage {
  const state = getOrCreate(matterId);
  const msg: PortalMessage = {
    id: `msg-${crypto.randomUUID().slice(0, 8)}`,
    direction: input.direction,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    staffAuthor: input.staffAuthor,
    readAt: input.direction === "outbound" ? new Date().toISOString() : undefined,
  };
  state.portalMessages.unshift(msg);
  if (input.direction === "outbound") {
    state.portalActivity.unshift({
      id: `act-${crypto.randomUUID().slice(0, 8)}`,
      alertType: "new_message",
      body: `Staff: ${input.body.slice(0, 80)}`,
      createdAt: new Date().toISOString(),
    });
  }
  saveSnapshot();
  return msg;
}

export function addPortalClientMessage(token: string, body: string): PortalMessage | null {
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return null;
  const state = getOrCreate(matterId);
  const msg: PortalMessage = {
    id: `msg-${crypto.randomUUID().slice(0, 8)}`,
    direction: "inbound",
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  state.portalMessages.unshift(msg);
  state.portalActivity.unshift({
    id: `act-${crypto.randomUUID().slice(0, 8)}`,
    alertType: "new_message",
    body: `Client: ${body.slice(0, 80)}`,
    createdAt: new Date().toISOString(),
  });
  addMatterNote(matterId, {
    text: `Client message: ${body}`,
    source: "system",
    authorLabel: "Client Portal",
  });
  saveSnapshot();
  return msg;
}

export function markPortalMessagesRead(matterId: string): void {
  const state = getOrCreate(matterId);
  for (const m of state.portalMessages) {
    if (m.direction === "inbound" && !m.readAt) {
      m.readAt = new Date().toISOString();
    }
  }
  saveSnapshot();
}

export function markDischargeFollowUpSent(
  matterId: string,
  input: {
    clientEmail: string;
    includePiCrossSell: boolean;
    sentAt: string;
    emailOk: boolean;
  }
): void {
  const state = getOrCreate(matterId);
  state.dischargeFollowUp = input;
  saveSnapshot();
}

export function getDischargeFollowUp(matterId: string) {
  return getOrCreate(matterId).dischargeFollowUp;
}

export function getMatterProfile(matterId: string) {
  const state = getOrCreate(matterId);
  return {
    matterId,
    debtorDisplayName: state.debtorDisplayName,
    chapter: state.chapter,
    clientEmail: state.clientEmail ?? null,
    clientPhone: state.clientPhone ?? null,
    clientFirstName: state.clientFirstName ?? null,
    clientLastName: state.clientLastName ?? null,
    county: state.county,
    district: state.district,
    caseNumber: state.filing?.caseNumber ?? null,
    filed: !!state.filing,
  };
}

export function updateMatterProfile(
  matterId: string,
  input: {
    clientEmail?: string;
    clientPhone?: string;
    clientFirstName?: string;
    clientLastName?: string;
    debtorDisplayName?: string;
  }
) {
  const state = getOrCreate(matterId);
  if (input.clientEmail !== undefined) state.clientEmail = input.clientEmail.trim() || undefined;
  if (input.clientPhone !== undefined) state.clientPhone = input.clientPhone.trim() || undefined;
  if (input.clientFirstName !== undefined) state.clientFirstName = input.clientFirstName.trim() || undefined;
  if (input.clientLastName !== undefined) state.clientLastName = input.clientLastName.trim() || undefined;
  if (input.debtorDisplayName !== undefined) state.debtorDisplayName = input.debtorDisplayName.trim();
  saveSnapshot();
  return getMatterProfile(matterId);
}

export function verifyIntakeDocument(
  matterId: string,
  documentId: string,
  input: { verified: boolean; note?: string; verifiedBy?: string }
): IntakeDocument | null {
  const state = getOrCreate(matterId);
  const doc = state.intakeDocuments.find((d) => d.id === documentId);
  if (!doc) return null;
  doc.staffVerified = input.verified;
  doc.staffVerifiedAt = input.verified ? new Date().toISOString() : undefined;
  doc.staffVerifiedBy = input.verified ? (input.verifiedBy ?? "Staff") : undefined;
  doc.staffNote = input.note;
  saveSnapshot();
  return doc;
}

export function getFinalReview(matterId: string): FinalReviewSnapshot {
  const state = getOrCreate(matterId);
  const unverified = state.intakeDocuments.filter((d) => !d.staffVerified).length;
  const pendingDocs = state.intakeDocuments.filter((d) => d.status !== "applied").length;
  return buildFinalReviewSnapshot({
    reviewFields: state.reviewFields,
    diagnostics: state.diagnostics,
    chapter: state.chapter,
    unverifiedDocumentCount: unverified,
    pendingDocumentCount: pendingDocs,
    stored: state.finalReview ?? {},
  });
}

export function updateFinalReviewStep(
  matterId: string,
  step: "documentsQa" | "numbersQa" | "attorneySignOff",
  input: { complete: boolean; attorneyName?: string }
): FinalReviewSnapshot {
  const state = getOrCreate(matterId);
  if (!state.finalReview) state.finalReview = {};
  const now = new Date().toISOString();
  if (step === "documentsQa") {
    state.finalReview.documentsQaComplete = input.complete;
    state.finalReview.documentsQaAt = input.complete ? now : undefined;
  } else if (step === "numbersQa") {
    state.finalReview.numbersQaComplete = input.complete;
    state.finalReview.numbersQaAt = input.complete ? now : undefined;
  } else if (step === "attorneySignOff") {
    state.finalReview.attorneySignOff = input.complete;
    state.finalReview.attorneySignOffAt = input.complete ? now : undefined;
    state.finalReview.attorneyName = input.complete
      ? (input.attorneyName ?? FIRM_ATTORNEY_NAME)
      : undefined;
  }
  if (input.complete && step === "attorneySignOff") {
    addMatterNote(matterId, {
      text: `Attorney final sign-off — cleared to file petition (${input.attorneyName ?? FIRM_ATTORNEY_NAME})`,
      source: "system",
      authorLabel: "Final Check",
    });
  }
  saveSnapshot();
  return getFinalReview(matterId);
}

export function getCalendarEvents(matterId: string): MatterCalendarEvent[] {
  const state = getOrCreate(matterId);
  return [...(state.calendarEvents ?? [])].sort((a, b) =>
    a.startAt.localeCompare(b.startAt)
  );
}

export function isAttorneySignOffComplete(matterId: string): boolean {
  return getFinalReview(matterId).readyForGavel;
}

export function getFilingPackagePreview(matterId: string) {
  const state = getOrCreate(matterId);
  const formIds = getApprovedFormIds(matterId);
  const petition = assembleDemoPetition(matterId);
  return {
    matterId,
    chapter: state.chapter,
    district: state.district,
    divisionName: state.divisionName,
    formIds,
    petitionCompletion: petition.overallCompletion,
    documents: formIds.map((formId) => ({
      formId,
      label: formLabel(formId),
      eventCode: cmecfEventCode(formId),
      status: "ready_for_preflight",
    })),
    efileMode: process.env.EFILE_MODE ?? "sandbox",
  };
}

export interface CourtPacketPagePreview {
  formId: string;
  label: string;
  eventCode: string;
  completionPercent: number;
  status: "ready" | "needs_review" | "building";
  fields: Array<{ label: string; value: string; status: string }>;
  editHref: string;
  editLabel: string;
}

export interface AttorneyToolLink {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

export function getCourtPacketPreview(
  matterId: string,
  options?: { practice?: boolean }
) {
  const state = getOrCreate(matterId);
  const practice = options?.practice === true;
  const efileMode = (process.env.EFILE_MODE === "live" ? "live" : "sandbox") as
    | "live"
    | "sandbox";
  const formIds = practice
    ? getFullPacketFormIds(state.chapter)
    : getApprovedFormIds(matterId);
  const petition = assembleDemoPetition(matterId);
  const finalReview = getFinalReview(matterId);

  const scheduleByFormId = new Map(petition.schedules.map((s) => [s.formId, s]));
  const pages: CourtPacketPagePreview[] = [];

  for (const formId of formIds) {
    const doc = {
      formId,
      label: formLabel(formId),
      eventCode: cmecfEventCode(formId),
      status: "ready_for_preflight" as const,
    };
    const schedule = scheduleByFormId.get(doc.formId);
    const reviewFields = state.reviewFields.filter((f) => f.formId === doc.formId);
    const fields = schedule
      ? schedule.items.map((item) => ({
          label: item.label,
          value: item.value,
          status: item.status,
        }))
      : reviewFields.map((f) => ({
          label: f.fieldPath,
          value: String(f.proposedValue ?? ""),
          status: f.approvalState,
        }));

    const completionPercent = schedule?.completionPercent ?? (
      reviewFields.length === 0
        ? 0
        : Math.round(
            (reviewFields.filter((f) => f.approvalState === "approved" || f.approvalState === "edited")
              .length /
              reviewFields.length) *
              100
          )
    );

    const status: CourtPacketPagePreview["status"] =
      completionPercent >= 100
        ? "ready"
        : fields.length === 0
          ? "building"
          : "needs_review";

    const edit = editSurfaceForForm(matterId, doc.formId, state.chapter);
    pages.push({
      formId: doc.formId,
      label: doc.label,
      eventCode: doc.eventCode,
      completionPercent,
      status,
      fields,
      editHref: edit.href,
      editLabel: edit.label,
    });
  }

  const attorneyTools: AttorneyToolLink[] = [
    {
      id: "scout",
      label: "Initial Consult",
      description: "Income, expenses, means test, take-case decision",
      href: `/matters/${matterId}/scout`,
      icon: "🎯",
    },
    {
      id: "documents",
      label: "Documents",
      description: "Uploads, paystubs, W-2s, client portal",
      href: `/matters/${matterId}/forge?section=dossier`,
      icon: "📁",
    },
    {
      id: "credit",
      label: "Credit review",
      description: "Tri-merge, schedule buckets, manual creditors",
      href: `/matters/${matterId}/forge?section=credit`,
      icon: "💳",
    },
    {
      id: "schedules",
      label: "Schedules A–J",
      description: "Property, exemptions, debts, income, expenses",
      href: `/matters/${matterId}/forge?section=schedules`,
      icon: "📊",
    },
    {
      id: "petition",
      label: "Petition review",
      description: "Approve or edit every petition field",
      href: `/matters/${matterId}/forge/review`,
      icon: "⚒️",
    },
    ...(state.chapter === "13"
      ? [
          {
            id: "plan",
            label: "Ch 13 plan",
            description: "Plan length, feasibility, disposable income",
            href: `/matters/${matterId}/plan`,
            icon: "📋",
          } satisfies AttorneyToolLink,
        ]
      : []),
    {
      id: "seal",
      label: "Final Sign-Off",
      description: "Documents QA, numbers QA, attorney sign-off",
      href: `/matters/${matterId}/forge?section=seal`,
      icon: "👍",
    },
    {
      id: "billing",
      label: "Trust & fees",
      description: "Retainer, payments, receipts",
      href: `/matters/${matterId}/billing`,
      icon: "💰",
    },
    {
      id: "audit",
      label: "Audit trail",
      description: "Every change with provenance export",
      href: `/matters/${matterId}/audit`,
      icon: "🔍",
    },
    {
      id: "practice",
      label: "Practice filing",
      description: "Review every court paper before sandbox e-file",
      href: `/matters/${matterId}/practice`,
      icon: "🧪",
    },
  ];

  return {
    matterId,
    debtorName: state.debtorDisplayName,
    chapter: state.chapter,
    district: state.district,
    divisionName: state.divisionName,
    petitionCompletion: petition.overallCompletion,
    readyForGavel: finalReview.readyForGavel,
    pages,
    attorneyTools,
    assembledAt: petition.assembledAt,
    practiceMode: practice,
    efileMode,
    liveFilingBlocked: practice || efileMode !== "live",
  };
}

function editSurfaceForForm(
  matterId: string,
  formId: string,
  chapter: "7" | "13"
): { href: string; label: string } {
  if (formId === "101") {
    return { href: `/matters/${matterId}/forge/review`, label: "Edit in petition review" };
  }
  if (formId === "107") {
    return {
      href: `/matters/${matterId}/forge?section=schedules&schedule=sofa`,
      label: "Edit SOFA",
    };
  }
  if (formId.startsWith("106")) {
    return { href: `/matters/${matterId}/forge?section=schedules`, label: "Edit on schedules" };
  }
  if (formId.startsWith("122")) {
    return { href: `/matters/${matterId}/scout`, label: "Edit in initial consult" };
  }
  if (formId === "cert-counsel") {
    return { href: `/matters/${matterId}/forge?section=dossier`, label: "Edit documents" };
  }
  if (formId === "3015-1.01" && chapter === "13") {
    return { href: `/matters/${matterId}/plan`, label: "Edit Ch 13 plan" };
  }
  return { href: `/matters/${matterId}/forge/review`, label: "Edit in petition review" };
}

function formLabel(formId: string): string {
  const labels: Record<string, string> = {
    "101": "Voluntary Petition",
    "106A/B": "Schedule A/B — Property",
    "106C": "Schedule C — Exemptions",
    "106D": "Schedule D — Secured Creditors",
    "106E/F": "Schedule E/F — Unsecured Creditors",
    "106G": "Schedule G — Executory Contracts",
    "106H": "Schedule H — Codebtors",
    "106I": "Schedule I — Income",
    "106J": "Schedule J — Expenses",
    "107": "Statement of Financial Affairs",
    "122A-1": "Form 122A-1 — Means Test",
    "122A-2": "Form 122A-2 — Means Test",
    "122C-1": "Form 122C-1 — Ch 13 Means Test",
    "122C-2": "Form 122C-2 — Ch 13 Means Test",
    "cert-counsel": "Credit Counseling Certificate",
    "3015-1.7": "CACB Local Form 3015-1.7",
    MML: "Creditor Matrix (MML)",
    "3015-1.01": "Ch 13 Plan (CACB)",
    "341": "341 Meeting Notice",
  };
  return labels[formId] ?? formId;
}

function cmecfEventCode(formId: string): string {
  if (formId === "101") return "PETITION";
  if (formId.startsWith("106")) return "SCHEDULE";
  if (formId.startsWith("122")) return "MEANS_TEST";
  return "MISC";
}
