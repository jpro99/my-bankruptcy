function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:3002`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
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

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });

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
  }>;
}

export function fetchPreflight(matterId: string) {
  return apiFetch<{ report: PreflightReport }>(`/api/preflight/matter/${matterId}`);
}

export function filePetition(matterId: string) {
  return apiFetch<{ caseNumber: string; message: string; status: string }>(
    `/api/preflight/matter/${matterId}/file`,
    { method: "POST" }
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
