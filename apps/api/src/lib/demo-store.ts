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
  adviseTradelineInclusion,
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
import { assemblePetition, type PetitionView, type ValuationProvenance } from "@chapterai/petition";
import type { ProvenanceEventType } from "@chapterai/provenance";
import { exportProvenanceBundle, type ProvenanceRecord } from "@chapterai/provenance";
import { loadDemoStore, persistDemoStore } from "./demo-persist.js";
import { portalTokenForMatter, verifyPortalToken } from "./secure-token.js";

export { portalTokenForMatter };

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
    tradelineInclusion: {},
    creditPulled: false,
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

export function assembleDemoPetition(matterId: string): PetitionView {
  const state = getOrCreate(matterId);
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
  value: string
): PetitionView {
  const state = getOrCreate(matterId);
  const field = state.reviewFields.find((f) => f.id === itemId);
  if (field) {
    const previous = field.proposedValue;
    field.proposedValue = parseMoney(value) ?? value;
    field.approvalState = "edited";
    recordDemoProvenance(matterId, {
      formFieldId: itemId,
      eventType: "attorney_edited",
      previousValue: previous,
      newValue: field.proposedValue,
      metadata: { source: "schedules_editor" },
    });
  } else if (itemId.startsWith("ex-")) {
    const assetId = itemId.slice(3);
    const asset = state.assets.find((a) => a.id === assetId);
    if (asset) {
      const amount = parseMoney(value);
      if (amount) asset.exemptionAmount = amount;
    }
  } else {
    const asset = state.assets.find((a) => a.id === itemId);
    if (asset) {
      const amount = parseMoney(value);
      if (amount) asset.currentValue = amount;
      const secured = value.match(/secured:\s*\$?([\d,]+\.?\d*)/i);
      if (secured?.[1]) asset.securedAmount = secured[1].replace(/,/g, "");
    } else {
      const tl = state.classifiedTradelines.find((t) => t.id === itemId);
      if (tl) {
        const amount = parseMoney(value);
        if (amount) tl.balance = amount;
        const monthly = value.match(/([\d,]+\.?\d*)\/mo/i);
        if (monthly?.[1]) tl.monthlyPayment = monthly[1].replace(/,/g, "");
      }
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
    householdSize: input.householdSize ?? 2,
    annualIncome: input.annualIncome ?? "72000.00",
    deductions: DEFAULT_DEDUCTIONS,
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
    state.portal = buildPortal(matterId, state);
  }
  if (state.portal?.counseling.course2.status === "locked") {
    state.portal.counseling.course2.status = "pending";
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
  const meta = COUNSELING_PROVIDER_META[providerKey] ?? COUNSELING_PROVIDER_META.debtorcc;
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
