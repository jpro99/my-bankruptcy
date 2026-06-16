import { adviseTradelineInclusion } from "./credit-advice";

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
    portalToken?: string;
    counselingComplete?: boolean;
    pendingIntakeCount?: number;
    noteCount?: number;
    consultComplete?: boolean;
  }>(`/api/command/matter/${matterId}`);
}

export interface MatterNote {
  id: string;
  text: string;
  source: "attorney" | "voice" | "system";
  createdAt: string;
  authorLabel: string;
}

export interface IntakeDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
  uploadedBy: "client" | "attorney";
  source: string;
  requestId?: string;
  status: "received" | "processed" | "applied";
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
  recommendation?: string;
  meansTestStatus?: string;
  recommendationRationale?: string;
  presumptionOfAbuse?: boolean;
}

export interface MatterDossier {
  documents: IntakeDocument[];
  notes: MatterNote[];
  consult?: ConsultSnapshot;
  pendingApplyCount: number;
  intakeProfile?: {
    debtorDisplayName: string;
    chapter: "7" | "13";
    clientEmail?: string;
    clientPhone?: string;
    clientFirstName?: string;
    clientLastName?: string;
  };
}

export interface DemoMatterSummary {
  matterId: string;
  debtorDisplayName: string;
  chapter: "7" | "13";
  status: "prospect" | "active" | "filed";
  consultComplete: boolean;
  pendingDocuments: number;
  noteCount: number;
  unreadPortalMessages?: number;
  createdAt: string;
  clientEmail?: string;
  clientPhone?: string;
  clientFirstName?: string;
  clientLastName?: string;
  overallPercent?: number;
  currentPhase?: "consult" | "prep" | "file" | "post-filing";
  currentStep?: string;
  balanceDue?: string;
  paidInFull?: boolean;
  lastContactAt?: string;
  lastContactKind?: "portal" | "note";
  county?: string;
  divisionName?: string;
}

export function fetchMatterDossier(matterId: string) {
  return apiFetch<{ dossier: MatterDossier }>(`/api/intake/matter/${matterId}/dossier`);
}

export function fetchMatterNotes(matterId: string) {
  return apiFetch<{ notes: MatterNote[] }>(`/api/intake/matter/${matterId}/notes`);
}

export function addMatterNoteApi(
  matterId: string,
  text: string,
  source: "attorney" | "voice" = "attorney"
) {
  return apiFetch<{ note: MatterNote }>(`/api/intake/matter/${matterId}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, source }),
  });
}

function authHeaders(): Headers {
  const headers = new Headers();
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1") {
    headers.set("x-firm-id", "00000000-0000-0000-0000-000000000010");
    headers.set("x-user-id", "00000000-0000-0000-0000-000000000001");
    headers.set("x-clerk-user-id", "dev_clerk_user");
    headers.set("x-user-email", "attorney@chapterai.dev");
    headers.set("x-user-role", "attorney");
  }
  return headers;
}

export async function uploadMatterRecording(
  matterId: string,
  form: FormData
): Promise<{ ok: boolean; title?: string }> {
  const headers = authHeaders();
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/api/intake/matter/${matterId}/recording`, {
      method: "POST",
      headers,
      body: form,
    });
  } catch {
    throw new Error(
      "Cannot reach API — start the backend locally or set NEXT_PUBLIC_API_URL on Vercel"
    );
  }

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    title?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? `API error ${response.status}`);
  }
  return { ok: true, title: data.title };
}

export function saveConsultApi(
  matterId: string,
  consult: Omit<
    ConsultSnapshot,
    | "evaluatedAt"
    | "recommendation"
    | "meansTestStatus"
    | "recommendationRationale"
    | "presumptionOfAbuse"
  > & { evaluate?: boolean }
) {
  return apiFetch<{ consult: ConsultSnapshot }>(`/api/intake/matter/${matterId}/consult`, {
    method: "POST",
    body: JSON.stringify(consult),
  });
}

export interface UploadMatchPreview {
  action: "proceed" | "confirm";
  extracted: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    confidence: number;
    source: string;
  };
  currentMatter: { matterId: string; debtorDisplayName: string };
  bestMatch?: {
    matterId: string;
    debtorDisplayName: string;
    score: number;
    reasons: string[];
  };
  message?: string;
}

export type IntakeUploadResult =
  | { ok: true; document: IntakeDocument; savedToMatterId: string }
  | { ok: false; mismatch: UploadMatchPreview };

async function intakePost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T | { mismatch: UploadMatchPreview }> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1") {
    headers.set("x-firm-id", "00000000-0000-0000-0000-000000000010");
    headers.set("x-user-id", "00000000-0000-0000-0000-000000000001");
    headers.set("x-clerk-user-id", "dev_clerk_user");
    headers.set("x-user-email", "attorney@chapterai.dev");
    headers.set("x-user-role", "attorney");
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    preview?: UploadMatchPreview;
    document?: IntakeDocument;
    savedToMatterId?: string;
  };

  if (response.status === 409 && data.error === "matter_mismatch" && data.preview) {
    return { mismatch: data.preview };
  }

  if (!response.ok) {
    throw new Error(data.error ?? `API error ${response.status}`);
  }

  return data as T;
}

async function intakeUploadFetch<T>(
  path: string,
  form: FormData
): Promise<T | { mismatch: UploadMatchPreview }> {
  const headers = new Headers();
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1") {
    headers.set("x-firm-id", "00000000-0000-0000-0000-000000000010");
    headers.set("x-user-id", "00000000-0000-0000-0000-000000000001");
    headers.set("x-clerk-user-id", "dev_clerk_user");
    headers.set("x-user-email", "attorney@chapterai.dev");
    headers.set("x-user-role", "attorney");
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers,
    body: form,
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    preview?: UploadMatchPreview;
    document?: IntakeDocument;
    savedToMatterId?: string;
  };

  if (response.status === 409 && data.error === "matter_mismatch" && data.preview) {
    return { mismatch: data.preview };
  }

  if (!response.ok) {
    throw new Error(data.error ?? `API error ${response.status}`);
  }

  return data as T;
}

export async function uploadIntakeDocumentFile(
  matterId: string,
  file: File,
  documentType?: string,
  options?: { confirmMismatch?: boolean; targetMatterId?: string }
): Promise<IntakeUploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (documentType) form.append("documentType", documentType);
  if (options?.confirmMismatch) form.append("confirmMismatch", "true");
  if (options?.targetMatterId) form.append("targetMatterId", options.targetMatterId);

  const result = await intakeUploadFetch<{
    document: IntakeDocument;
    savedToMatterId: string;
  }>(`/api/intake/matter/${matterId}/upload/file`, form);

  if ("mismatch" in result) {
    return { ok: false, mismatch: result.mismatch };
  }

  return {
    ok: true,
    document: result.document,
    savedToMatterId: result.savedToMatterId ?? matterId,
  };
}

export function intakeDocumentFileUrl(matterId: string, documentId: string): string {
  return `${getPublicApiBase()}/api/intake/matter/${matterId}/documents/${documentId}/file`;
}

export async function downloadIntakeDocumentFile(
  matterId: string,
  documentId: string,
  fileName: string
): Promise<void> {
  const headers = new Headers();
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "1") {
    headers.set("x-firm-id", "00000000-0000-0000-0000-000000000010");
    headers.set("x-user-id", "00000000-0000-0000-0000-000000000001");
    headers.set("x-clerk-user-id", "dev_clerk_user");
    headers.set("x-user-email", "attorney@chapterai.dev");
    headers.set("x-user-role", "attorney");
  }

  const response = await fetch(intakeDocumentFileUrl(matterId, documentId), { headers });
  if (!response.ok) {
    throw new Error("Document file not available");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function uploadIntakeDocument(
  matterId: string,
  fileName: string,
  documentType?: string,
  options?: { confirmMismatch?: boolean; targetMatterId?: string }
): Promise<IntakeUploadResult> {
  const result = await intakePost<{
    document: IntakeDocument;
    savedToMatterId: string;
  }>(`/api/intake/matter/${matterId}/upload`, {
    fileName,
    documentType,
    confirmMismatch: options?.confirmMismatch,
    targetMatterId: options?.targetMatterId,
  });

  if ("mismatch" in result) {
    return { ok: false, mismatch: result.mismatch };
  }

  return {
    ok: true,
    document: result.document,
    savedToMatterId: result.savedToMatterId ?? matterId,
  };
}

export interface TestDataImportResult {
  debtorName: string;
  documentsAdded: number;
  debtsAdded: number;
  consultEvaluated: boolean;
  lines: string[];
}

export function importTestDataCsv(matterId: string, csv: string) {
  return apiFetch<{ result: TestDataImportResult }>(
    `/api/intake/matter/${matterId}/import-test-csv`,
    { method: "POST", body: JSON.stringify({ csv }) }
  );
}

export type ForgeSyncResult =
  | { ok: true; appliedCount: number; fieldIds: string[]; message: string; redirectedTo?: string }
  | { ok: false; mismatch: UploadMatchPreview };

export async function applyForgeSync(
  matterId: string,
  options?: { confirmMismatch?: boolean; targetMatterId?: string }
): Promise<ForgeSyncResult> {
  const result = await intakePost<{
    appliedCount: number;
    fieldIds: string[];
    message: string;
    redirectedTo?: string;
  }>(`/api/intake/matter/${matterId}/apply`, {
    confirmMismatch: options?.confirmMismatch,
    targetMatterId: options?.targetMatterId,
  });

  if ("mismatch" in result) {
    return { ok: false, mismatch: result.mismatch };
  }

  return { ok: true, ...result };
}

export function listDemoMatters() {
  return apiFetch<{ matters: DemoMatterSummary[] }>(`/api/intake/matters`);
}

export function createDemoMatter(input: {
  debtorDisplayName: string;
  chapter?: "7" | "13";
  county?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientFirstName?: string;
  clientLastName?: string;
}) {
  return apiFetch<{ matter: DemoMatterSummary }>(`/api/intake/matters`, {
    method: "POST",
    body: JSON.stringify(input),
  });
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
}

export function fetchPortalStaff(matterId: string) {
  return apiFetch<{
    messages: PortalMessage[];
    activity: PortalActivityEvent[];
    portalUrl: string;
  }>(`/api/portal/staff/${matterId}`);
}

export function sendPortalStaffMessage(matterId: string, body: string) {
  return apiFetch<{ message: PortalMessage }>(`/api/portal/staff/${matterId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function sendPortalInvite(
  matterId: string,
  input: { channel: "email" | "sms"; recipient: string; clientName?: string }
) {
  return apiFetch<{ ok: boolean; link: string; message: string; mailto?: string }>(
    `/api/portal/staff/${matterId}/invite`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function sendPortalClientMessage(token: string, body: string) {
  return portalFetch<{ success: boolean }>(`/api/portal/${token}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export interface PaymentReceipt {
  id: string;
  matterId: string;
  amount: string;
  method: string;
  checkNumber?: string;
  note?: string;
  receivedAt: string;
  receivedBy: string;
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
  payments?: PaymentReceipt[];
}

export function fetchBilling(matterId: string) {
  return apiFetch<{ invoice: MatterInvoice }>(`/api/billing/matter/${matterId}`);
}

export function recordBillingPayment(
  matterId: string,
  input: {
    amount: string;
    method: string;
    checkNumber?: string;
    note?: string;
  }
) {
  return apiFetch<{ invoice: MatterInvoice; receipt: PaymentReceipt }>(
    `/api/billing/matter/${matterId}/payment`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export interface PortalRequest {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
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

export interface PortalData {
  token: string;
  matterId: string;
  debtorName: string;
  chapter: string;
  caseNumber?: string;
  requests: PortalRequest[];
  message: string;
  counseling: PortalCounseling;
  filed: boolean;
}

async function portalFetch<T>(
  path: string,
  options: RequestInit & { omitJsonContentType?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!options.omitJsonContentType) {
    headers.set("Content-Type", "application/json");
  }
  const { omitJsonContentType: _, ...fetchOptions } = options;
  const response = await fetch(`${getApiBase()}${path}`, { ...fetchOptions, headers });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchPortal(token: string) {
  return portalFetch<{ portal: PortalData }>(`/api/portal/${token}`);
}

export function uploadPortalDocument(
  token: string,
  requestId: string,
  file: File,
  documentType?: string
) {
  const form = new FormData();
  form.append("file", file);
  form.append("requestId", requestId);
  if (documentType) form.append("documentType", documentType);
  return portalFetch<{ success: boolean; document?: IntakeDocument }>(
    `/api/portal/${token}/upload/file`,
    { method: "POST", body: form, omitJsonContentType: true }
  );
}

export function uploadPortalDocumentMeta(
  token: string,
  requestId: string,
  fileName: string,
  documentType?: string
) {
  return portalFetch<{ success: boolean }>(`/api/portal/${token}/upload`, {
    method: "POST",
    body: JSON.stringify({ requestId, fileName, documentType }),
  });
}

export function uploadPortalGeneralDocument(token: string, file: File, documentType?: string) {
  const form = new FormData();
  form.append("file", file);
  if (documentType) form.append("documentType", documentType);
  return portalFetch<{ success: boolean; document: IntakeDocument }>(
    `/api/portal/${token}/upload-general/file`,
    { method: "POST", body: form, omitJsonContentType: true }
  );
}

export function uploadPortalGeneralDocumentMeta(
  token: string,
  fileName: string,
  documentType?: string
) {
  return portalFetch<{ success: boolean; document: { id: string; fileName: string } }>(
    `/api/portal/${token}/upload-general`,
    {
      method: "POST",
      body: JSON.stringify({ fileName, documentType }),
    }
  );
}

export function completePortalCounseling(
  token: string,
  course: 1 | 2,
  options?: { certificateFileName?: string; simulateGold?: boolean }
) {
  return portalFetch<{ success: boolean; portal: PortalData }>(
    `/api/portal/${token}/counseling/complete`,
    {
      method: "POST",
      body: JSON.stringify({ course, ...options }),
    }
  );
}

export function fetchAgreement() {
  return portalFetch<{ version: string; text: string }>(`/api/firms/agreement`);
}

export function signupFirm(input: {
  firmName: string;
  attorneyFirstName: string;
  attorneyLastName: string;
  email: string;
  phone?: string;
  state?: string;
  counselingTier: "gold" | "relay" | "vault";
  counselingProvider: "debtorcc" | "bkcert" | "advantagecc" | "creditorg";
  agreementAccepted: true;
}) {
  return portalFetch<{
    firmId: string;
    firmName: string;
    demoMatterUrl: string;
    message: string;
  }>(`/api/firms/signup`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Phase 7: Schedules, Districts, Provenance ---

export interface ValuationProvenance {
  tier: "low" | "medium" | "high";
  selectedAmount: string;
  lowAmount?: string;
  mediumAmount?: string;
  highAmount?: string;
  sourceName: string;
  sourceUrl?: string;
  lookupDate: string;
  method?: string;
  snapshotLines?: string[];
}

export interface PetitionLineItem {
  id: string;
  label: string;
  value: string;
  status: string;
  confidence?: number;
  sourceDocument?: string;
  formReference?: string;
  valuation?: ValuationProvenance;
  isManual?: boolean;
  scheduleBucket?: "D" | "E" | "F" | "G";
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

export interface CourtReadinessForm {
  formId: string;
  label: string;
  category: "official" | "local" | "certificate" | "plan";
}

export interface CourtReadiness {
  county: string;
  district: string;
  districtName: string;
  courtName: string;
  division: { id: string; name: string; courthouse: string };
  cmEcfBaseUrl: string;
  chapter: "7" | "13";
  requiredForms: CourtReadinessForm[];
  localFormIds: string[];
  surroundingCounties: string[];
  connections: {
    cmEcf: "sandbox" | "live_attempt" | "not_configured";
    localFormsInSystem: boolean;
    countyRouting: boolean;
    practiceReady: boolean;
  };
}

export function fetchMatterCourtReadiness(matterId: string) {
  return apiFetch<{
    matterId: string;
    readiness: CourtReadiness;
    formsInPracticePacket: number;
    formsMatchDistrict: boolean;
  }>(`/api/districts/matter/${matterId}/readiness`);
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
  isManual?: boolean;
  isDuplicate?: boolean;
  duplicateOfId?: string | null;
  duplicateOfName?: string;
}

export interface TradelinePatchInput {
  included?: boolean;
  schedule?: "D" | "E" | "F" | "G";
  isDuplicate?: boolean;
  duplicateOfId?: string | null;
  creditorName?: string;
  balance?: string;
  monthlyPayment?: string;
}

export interface ManualCreditorInput {
  creditorName: string;
  balance: string;
  schedule: "D" | "E" | "F" | "G";
  accountType?: string;
  monthlyPayment?: string;
  collateralDescription?: string;
}

export function fetchCreditReview(matterId: string) {
  return apiFetch<{
    matterId: string;
    entries: TradelineReviewEntry[];
    total: number;
    includedCount: number;
    excludedCount: number;
    reviewApiAvailable?: boolean;
  }>(`/api/credit/matter/${matterId}/review`)
    .then((data) => ({ ...data, reviewApiAvailable: true as const }))
    .catch(async (err) => {
      if (!(err instanceof Error && err.message.includes("404"))) throw err;
      const data = await apiFetch<{
        tradelines: Omit<TradelineReviewEntry, "included" | "fieldId" | "advice">[];
      }>(`/api/credit/matter/${matterId}/tradelines`);
      const entries: TradelineReviewEntry[] = data.tradelines.map((tl) => ({
        ...tl,
        included: true,
        fieldId: `credit-${tl.id}`,
        advice: adviseTradelineInclusion(tl),
      }));
      return {
        matterId,
        entries,
        total: entries.length,
        includedCount: entries.length,
        excludedCount: 0,
        reviewApiAvailable: false as const,
      };
    });
}

export function setTradelineIncluded(matterId: string, tradelineId: string, included: boolean) {
  return patchTradeline(matterId, tradelineId, { included });
}

export function patchTradeline(
  matterId: string,
  tradelineId: string,
  patch: TradelinePatchInput
) {
  return apiFetch<{
    matterId: string;
    tradelineId: string;
    entries: TradelineReviewEntry[];
    diagnostics: ApiDiagnostics;
    petition: PetitionView;
  }>(`/api/credit/matter/${matterId}/tradelines/${tradelineId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function addManualCreditor(matterId: string, input: ManualCreditorInput) {
  return apiFetch<{
    matterId: string;
    tradeline: TradelineReviewEntry;
    entries: TradelineReviewEntry[];
    diagnostics: ApiDiagnostics;
    petition: PetitionView;
  }>(`/api/credit/matter/${matterId}/tradelines`, {
    method: "POST",
    body: JSON.stringify(input),
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

export interface FilingPackageDocument {
  formId: string;
  label: string;
  eventCode: string;
  status: string;
}

export interface FilingPackage {
  matterId: string;
  chapter: "7" | "13";
  district: string;
  divisionName: string;
  formIds: string[];
  petitionCompletion: number;
  documents: FilingPackageDocument[];
  efileMode: string;
}

export function fetchFilingPackage(matterId: string) {
  return apiFetch<{ package: FilingPackage }>(`/api/filing/matter/${matterId}/package`);
}

export interface CourtPacketPage {
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

export interface CourtPacketPreview {
  matterId: string;
  debtorName: string;
  chapter: "7" | "13";
  district: string;
  divisionName: string;
  petitionCompletion: number;
  readyForGavel: boolean;
  pages: CourtPacketPage[];
  attorneyTools: AttorneyToolLink[];
  assembledAt: string;
  practiceMode?: boolean;
  efileMode?: "sandbox" | "live";
  liveFilingBlocked?: boolean;
}

export function fetchCourtPacketPreview(
  matterId: string,
  options?: { practice?: boolean }
) {
  const query = options?.practice ? "?practice=1" : "";
  return apiFetch<{ preview: CourtPacketPreview }>(
    `/api/filing/matter/${matterId}/court-preview${query}`
  );
}

export function fetchDischargeFollowUpPreview(matterId: string) {
  return apiFetch<{ template: { subject: string; text?: string; preview?: string } }>(
    `/api/follow-up/matter/${matterId}/discharge/preview`
  );
}

export function sendDischargeFollowUp(
  matterId: string,
  body: { clientEmail: string; includePiCrossSell?: boolean; sendEmail?: boolean }
) {
  return apiFetch<{
    success: boolean;
    template: { subject: string; preview?: string };
    email: { ok: boolean; messageId?: string; error?: string; mailto?: string };
  }>(`/api/follow-up/matter/${matterId}/discharge`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface IntegrationStatusBlock {
  status: string;
  note?: string;
  provider?: string;
  fromAddress?: string | null;
  missing?: string[];
  bridge?: string;
  firmName?: string;
  url?: string | null;
  phone?: string | null;
}

export function fetchIntegrationsStatus() {
  return apiFetch<{
    integrations: {
      database: IntegrationStatusBlock;
      outboundEmail: IntegrationStatusBlock;
      clientPortal: IntegrationStatusBlock;
      creditPull: IntegrationStatusBlock;
      efile: IntegrationStatusBlock;
      counseling: IntegrationStatusBlock;
      worker: IntegrationStatusBlock;
      piCrossSell: IntegrationStatusBlock;
    };
    courtConnections: Record<string, { cmEcf: string; localForms: string[] }>;
    filingPackage: { formsIncluded: string[]; pdfGeneration: string; note: string };
  }>("/api/integrations/status");
}

export interface JudgeFlagItem {
  id: string;
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  formReference?: string;
}

export interface FinalReviewSnapshot {
  documentsQaComplete: boolean;
  documentsQaAt?: string;
  numbersQaComplete: boolean;
  numbersQaAt?: string;
  attorneySignOff: boolean;
  attorneySignOffAt?: string;
  attorneyName?: string;
  judgeFlags: JudgeFlagItem[];
  judgeFlagsClear: boolean;
  readyForGavel: boolean;
}

export function fetchFinalReview(matterId: string) {
  return apiFetch<{ finalReview: FinalReviewSnapshot }>(
    `/api/workflow/matter/${matterId}/final-review`
  );
}

export function updateFinalReviewStep(
  matterId: string,
  step: "documentsQa" | "numbersQa" | "attorneySignOff",
  body: { complete: boolean; attorneyName?: string }
) {
  return apiFetch<{ finalReview: FinalReviewSnapshot }>(
    `/api/workflow/matter/${matterId}/final-review/${step}`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function verifyIntakeDocument(
  matterId: string,
  documentId: string,
  body: { verified: boolean; note?: string }
) {
  return apiFetch<{ document: IntakeDocument; finalReview: FinalReviewSnapshot }>(
    `/api/workflow/matter/${matterId}/documents/${documentId}/verify`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export interface MatterCalendarEvent {
  id: string;
  kind: string;
  title: string;
  startAt: string;
  durationMin: number;
  details: string;
  location?: string;
  autoGenerated: boolean;
  source: string;
}

export function fetchMatterCalendar(matterId: string) {
  return apiFetch<{ events: MatterCalendarEvent[] }>(`/api/workflow/matter/${matterId}/calendar`);
}

export function fetchMatterProfile(matterId: string) {
  return apiFetch<{
    profile: {
      matterId: string;
      debtorDisplayName: string;
      chapter: "7" | "13";
      clientEmail: string | null;
      clientPhone: string | null;
      caseNumber: string | null;
      filed: boolean;
    };
  }>(`/api/workflow/matter/${matterId}/profile`);
}

export type CopilotPhase = "scout" | "forge" | "gavel" | "continuum";

export interface CopilotAnswer {
  answer: string;
  suggestedAction?: { label: string; href: string };
  demoMode: boolean;
  piiRedacted: boolean;
}

export function askReliefCopilot(
  matterId: string,
  body: { question: string; phase: CopilotPhase }
) {
  return apiFetch<CopilotAnswer>(`/api/copilot/matter/${matterId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
