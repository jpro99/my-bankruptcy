import type { DemoMatterSummary } from "@/lib/api-client";

export type MatterLifecycle = "potential" | "active" | "completed";

export const MATTER_LIFECYCLE_TABS: Array<{
  id: "all" | MatterLifecycle;
  label: string;
  hint: string;
}> = [
  { id: "all", label: "All", hint: "Every matter" },
  { id: "potential", label: "Potential", hint: "Consult — not retained yet" },
  { id: "active", label: "Active Cases", hint: "Retained — prep through post-filing" },
  { id: "completed", label: "Completed", hint: "Discharged — closure & receipts" },
];

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatPhoneDisplay(phone?: string): string | null {
  if (!phone?.trim()) return null;
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

/** Client-side fallback if API omits lifecycleStage */
export function deriveLifecycleStage(m: DemoMatterSummary): MatterLifecycle {
  if (m.lifecycleStage) return m.lifecycleStage;
  if (m.status === "prospect") return "potential";
  return "active";
}

export function matchesMatterSearch(m: DemoMatterSummary, query: string): boolean {
  const raw = query.trim();
  if (!raw) return true;

  const q = raw.toLowerCase();
  const qPhone = normalizePhone(raw);

  const haystack = [
    m.debtorDisplayName,
    m.clientFirstName,
    m.clientLastName,
    m.clientEmail,
    m.clientPhone,
    m.matterId,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  if (haystack.some((field) => field.includes(q))) return true;

  if (qPhone.length >= 3) {
    const matterPhone = normalizePhone(m.clientPhone ?? "");
    if (matterPhone.includes(qPhone)) return true;
  }

  return false;
}

export function filterMatters(
  matters: DemoMatterSummary[],
  options: { query: string; lifecycle: "all" | MatterLifecycle }
): DemoMatterSummary[] {
  return matters.filter((m) => {
    const stage = deriveLifecycleStage(m);
    if (options.lifecycle !== "all" && stage !== options.lifecycle) return false;
    return matchesMatterSearch(m, options.query);
  });
}
