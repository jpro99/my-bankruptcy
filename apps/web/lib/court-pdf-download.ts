function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "http://localhost:3002";
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

function courtPdfUrl(matterId: string, options?: { formId?: string; practice?: boolean }): string {
  const base = getApiBase();
  const practice = options?.practice ? "practice=1" : "";
  if (options?.formId) {
    const formId = encodeURIComponent(options.formId);
    return `${base}/api/filing/matter/${matterId}/court-pdf/${formId}${practice ? `?${practice}` : ""}`;
  }
  return `${base}/api/filing/matter/${matterId}/court-pdf${practice ? `?${practice}` : ""}`;
}

/** Open official-layout PDF in a new tab (uses auth headers via fetch + blob URL). */
export async function openCourtFormPdf(
  matterId: string,
  formId: string,
  options?: { practice?: boolean }
): Promise<void> {
  const response = await fetch(courtPdfUrl(matterId, { formId, practice: options?.practice }), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `PDF failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Open full court packet PDF in a new tab. */
export async function openCourtPacketPdf(
  matterId: string,
  options?: { practice?: boolean }
): Promise<void> {
  const response = await fetch(courtPdfUrl(matterId, { practice: options?.practice }), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `PDF failed (${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
