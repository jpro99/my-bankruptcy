function getApiBase(): string {
  // Production deploy (Vercel + Railway) — set in Vercel env vars
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Phone on same Wi‑Fi as dev machine (LAN testing at home)
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:3002`;
    }
  }
  return "http://localhost:3002";
}

export function getPublicApiBase(): string {
  return getApiBase();
}

/** Ping Railway/local API — used for connection banner */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBase()}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1") {
    headers.set("x-firm-id", "00000000-0000-0000-0000-000000000010");
    headers.set("x-user-id", "00000000-0000-0000-0000-000000000001");
    headers.set("x-clerk-user-id", "dev_clerk_user");
    headers.set("x-user-email", "attorney@chapterai.dev");
    headers.set("x-user-role", "attorney");
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach API — start the backend locally or set NEXT_PUBLIC_API_URL on Vercel"
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface ApiReviewField {
  id: string;
  fieldPath: string;
  formId: string;
  proposedValue: unknown;
  confidence: number;
  approvalState: "pending" | "approved" | "edited" | "questioned";
  rationale?: string;
  sourceDocument?: { id: string; fileName: string };
}

export interface ApiDiagnostics {
  missingFields: number;
  exemptionGaps: number;
  meansTestStatus: "pass" | "fail" | "review";
  presumptionOfAbuse: boolean;
  chapterRecommendation: "7" | "13" | "review";
  recommendationRationale: string;
  creditSummary?: {
    scheduleD: number;
    scheduleE: number;
    scheduleF: number;
    scheduleG: number;
    totalSecured: string;
    totalPriority: string;
    totalUnsecured: string;
  };
  computedAt?: string;
}

export function fetchReviewQueue(matterId: string) {
  return apiFetch<{ fields: ApiReviewField[]; total: number }>(
    `/api/form-fields/matter/${matterId}/review-queue`
  );
}

export function fetchDiagnostics(matterId: string) {
  return apiFetch<{ diagnostics: ApiDiagnostics }>(
    `/api/diagnostics/matter/${matterId}`
  );
}

export function approveField(matterId: string, fieldId: string, approvedValue?: unknown) {
  return apiFetch(`/api/form-fields/${fieldId}/approve`, {
    method: "POST",
    headers: { "x-matter-id": matterId },
    body: JSON.stringify({ approvedValue }),
  });
}

export function bulkApproveFields(matterId: string, minConfidence = 0.95) {
  return apiFetch(`/api/form-fields/bulk-approve`, {
    method: "POST",
    body: JSON.stringify({ matterId, minConfidence }),
  });
}

export function pullCredit(matterId: string) {
  return apiFetch<{
    tradelineCount: number;
    summary: ApiDiagnostics["creditSummary"];
    diagnostics: ApiDiagnostics;
  }>(`/api/credit/matter/${matterId}/pull`, {
    method: "POST",
    body: JSON.stringify({
      debtorFirstName: "Maria",
      debtorLastName: "Martinez",
      ssnLast4: "1234",
    }),
  });
}

export function questionField(matterId: string, fieldId: string) {
  return apiFetch(`/api/form-fields/${fieldId}/question`, {
    method: "POST",
    headers: { "x-matter-id": matterId },
  });
}

export interface PreflightReport {
  matterId: string;
  chapter: string;
  totalRules: number;
  passed: number;
  errors: number;
  warnings: number;
  readyToFile: boolean;
  results: Array<{
    ruleId: string;
    category: string;
    severity: string;
    message: string;
    passed: boolean;
    formReference?: string;
  }>;
}

export function fetchPreflight(matterId: string) {
  return apiFetch<{ report: PreflightReport }>(`/api/preflight/matter/${matterId}`);
}

export function filePetition(matterId: string) {
  return apiFetch<{
    caseNumber: string;
    message: string;
    status: string;
    receiptUrl?: string;
    documentsFiled?: number;
    autopilot?: { taskCount: number };
  }>(`/api/preflight/matter/${matterId}/file`, { method: "POST" });
}

export interface FilingStatus {
  matterId: string;
  filed: boolean;
  filing: {
    caseNumber: string;
    filedAt: string;
    receiptNumber: string;
    receiptUrl?: string;
    documentsFiled: number;
    message: string;
  } | null;
  packagePreview?: {
    documentCount: number;
    documents: Array<{ formId: string; label: string; eventCode: string }>;
    validation: { valid: boolean; errors: string[]; warnings: string[] };
  } | null;
}

export function fetchFilingStatus(matterId: string) {
  return apiFetch<FilingStatus>(`/api/efile/matter/${matterId}`);
}

export interface AutopilotTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  autoAction?: string;
}

export interface AutopilotTimeline {
  matterId: string;
  caseNumber: string;
  chapter: string;
  filingDate: string;
  tasks: AutopilotTask[];
  summary: {
    total: number;
    due: number;
    overdue: number;
    completed: number;
    upcoming: number;
  };
}

export function fetchAutopilot(matterId: string) {
  return apiFetch<{
    matterId: string;
    filed: boolean;
    timeline: AutopilotTimeline | null;
    message?: string;
  }>(`/api/autopilot/matter/${matterId}`);
}

export function completeAutopilotTask(matterId: string, taskId: string) {
  return apiFetch<{ timeline: AutopilotTimeline }>(
    `/api/autopilot/matter/${matterId}/tasks/${taskId}`,
    { method: "POST", body: JSON.stringify({ action: "complete" }) }
  );
}

export function runAutopilotAutoAction(matterId: string, taskId: string) {
  return apiFetch<{ task: AutopilotTask; autoActionResult: Record<string, unknown> | null }>(
    `/api/autopilot/matter/${matterId}/tasks/${taskId}`,
    { method: "POST", body: JSON.stringify({ action: "run-auto" }) }
  );
}

export interface PlanFeasibilityResult {
  feasible: boolean;
  recommendation: string;
  payments: {
    totalMonthlyPlanPayment: string;
    planLengthMonths: number;
    securedDirectPayments: string;
    priorityPayments: string;
    unsecuredPool: string;
    trusteeFee: string;
  };
  bestInterest: {
    passes: boolean;
    rationale: string;
  };
}

export function calculatePlan(matterId: string) {
  return apiFetch<PlanFeasibilityResult>(`/api/plan/matter/${matterId}/calculate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export interface MatterProgressStep {
  id: string;
  title: string;
  description: string;
  status: string;
  actionLabel?: string;
  actionHref?: string;
  estimatedMinutes?: number;
}

export interface MatterProgress {
  matterId: string;
  chapter: string;
  debtorDisplayName: string;
  overallPercent: number;
  stepsComplete: number;
  stepsTotal: number;
  steps: MatterProgressStep[];
  nextAction?: { stepId: string; title: string; href: string; label: string };
  readyToFile: boolean;
  tagline: string;
}

export function fetchCommandCenter(matterId: string) {
  return apiFetch<{
    progress: MatterProgress;
    preflightReady: boolean;
    caseNumber?: string;
    portalUrl: string;
  }>(`/api/command/matter/${matterId}`);
}

export interface MatterInvoice {
  matterId: string;
  chapter: string;
  packageId: string;
  subtotal: string;
  paidAmount: string;
  balanceDue: string;
  status: string;
  trustBalance: string;
  lines: Array<{ id: string; description: string; amount: string; category: string; paid: boolean }>;
}

export function fetchBilling(matterId: string) {
  return apiFetch<{ invoice: MatterInvoice }>(`/api/billing/matter/${matterId}`);
}

export function recordBillingPayment(matterId: string, amount: string) {
  return apiFetch<{ invoice: MatterInvoice }>(`/api/billing/matter/${matterId}/payment`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export interface PortalRequest {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  uploadedFileName?: string;
}

export interface PortalData {
  token: string;
  matterId: string;
  debtorName: string;
  chapter: string;
  caseNumber?: string;
  requests: PortalRequest[];
  message: string;
}

async function portalFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchPortal(token: string) {
  return portalFetch<{ portal: PortalData }>(`/api/portal/${token}`);
}

export function uploadPortalDocument(token: string, requestId: string, fileName: string) {
  return portalFetch<{ success: boolean }>(`/api/portal/${token}/upload`, {
    method: "POST",
    body: JSON.stringify({ requestId, fileName }),
  });
}

// --- Phase 7: Schedules, Districts, Provenance ---

export interface PetitionLineItem {
  id: string;
  label: string;
  value: string;
  status: string;
  confidence?: number;
  sourceDocument?: string;
  formReference?: string;
}

export interface PetitionSchedule {
  id: string;
  formId: string;
  title: string;
  description: string;
  items: PetitionLineItem[];
  completionPercent: number;
  itemCount: number;
  approvedCount: number;
}

export interface PetitionView {
  matterId: string;
  district: string;
  division?: string;
  county: string;
  chapter: string;
  debtorName: string;
  schedules: PetitionSchedule[];
  totalFields: number;
  approvedFields: number;
  overallCompletion: number;
  assembledAt: string;
}

export interface DistrictInfo {
  district: string;
  county: string;
  divisionId: string;
  divisionName: string;
  courtName: string;
}

export interface CaliforniaDistrictListItem {
  code: string;
  name: string;
  shortName: string;
  courtName: string;
  primaryCounties: string[];
}

export interface ProvenanceEvent {
  id: string;
  formFieldId: string;
  matterId: string;
  eventType: string;
  previousValue?: unknown;
  newValue: unknown;
  confidence?: number;
  modelName?: string;
  actorUserId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function fetchSchedules(matterId: string) {
  return apiFetch<{ petition: PetitionView; district: DistrictInfo }>(
    `/api/schedules/matter/${matterId}`
  );
}

export function fetchDistrict(matterId: string) {
  return apiFetch<{ district: DistrictInfo }>(`/api/districts/matter/${matterId}`);
}

export function listDistricts() {
  return apiFetch<{ districts: CaliforniaDistrictListItem[] }>(`/api/districts`);
}

export function setMatterDistrict(
  matterId: string,
  input: { district?: string; county?: string }
) {
  return apiFetch<{ district: DistrictInfo; petition: PetitionView }>(
    `/api/districts/matter/${matterId}`,
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export interface TradelineReviewEntry {
  id: string;
  creditorName: string;
  accountType: string;
  balance: string;
  monthlyPayment?: string;
  schedule: "D" | "E" | "F" | "G";
  confidence: number;
  rationale: string;
  included: boolean;
  fieldId: string;
  advice: { recommendation: "keep" | "exclude"; reason: string };
}

export function fetchCreditReview(matterId: string) {
  return apiFetch<{
    matterId: string;
    entries: TradelineReviewEntry[];
    total: number;
    includedCount: number;
    excludedCount: number;
  }>(`/api/credit/matter/${matterId}/review`);
}

export function setTradelineIncluded(matterId: string, tradelineId: string, included: boolean) {
  return apiFetch<{
    matterId: string;
    tradelineId: string;
    included: boolean;
    entries: TradelineReviewEntry[];
    diagnostics: ApiDiagnostics;
  }>(`/api/credit/matter/${matterId}/tradelines/${tradelineId}`, {
    method: "PATCH",
    body: JSON.stringify({ included }),
  });
}

export function updateScheduleItem(matterId: string, itemId: string, value: string) {
  return apiFetch<{ petition: PetitionView; district: DistrictInfo; itemId: string; value: string }>(
    `/api/schedules/matter/${matterId}/items/${itemId}`,
    { method: "PATCH", body: JSON.stringify({ value }) }
  );
}

export function fetchProvenance(matterId: string) {
  return apiFetch<{ matterId: string; eventCount: number; events: ProvenanceEvent[] }>(
    `/api/provenance/matter/${matterId}`
  );
}

export function exportProvenance(matterId: string) {
  return apiFetch<{
    matterId: string;
    exportedAt: string;
    eventCount: number;
    events: ProvenanceEvent[];
    integrityHash: string;
  }>(`/api/provenance/matter/${matterId}/export`);
}
