import type { MatterDiagnosticsPayload } from "@chapterai/means-test";
import type { DemoReviewField } from "./demo-store.js";

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

/** Numbers & schedules that often trigger trustee or judge scrutiny */
export function scanJudgeFlags(input: {
  reviewFields: DemoReviewField[];
  diagnostics: MatterDiagnosticsPayload;
  chapter: "7" | "13";
  unverifiedDocumentCount: number;
  pendingDocumentCount: number;
}): JudgeFlagItem[] {
  const flags: JudgeFlagItem[] = [];
  const pending = input.reviewFields.filter((f) => f.approvalState === "pending").length;

  if (pending > 0) {
    flags.push({
      id: "JF-PENDING-FIELDS",
      severity: "error",
      category: "Review",
      message: `${pending} petition field(s) still pending attorney approval`,
      formReference: "101",
    });
  }

  if (input.diagnostics.presumptionOfAbuse && input.chapter === "7") {
    flags.push({
      id: "JF-MEANS-ABUSE",
      severity: "error",
      category: "Means Test",
      message: "§707(b) presumption of abuse — Ch 7 may be challenged",
      formReference: "122A-1",
    });
  }

  if (input.diagnostics.exemptionGaps > 0) {
    flags.push({
      id: "JF-EXEMPTION-GAP",
      severity: "warning",
      category: "Exemptions",
      message: `${input.diagnostics.exemptionGaps} exemption gap(s) — verify Schedule C`,
      formReference: "106C",
    });
  }

  if (input.unverifiedDocumentCount > 0) {
    flags.push({
      id: "JF-DOC-QA",
      severity: "error",
      category: "Documents",
      message: `${input.unverifiedDocumentCount} client document(s) not staff-verified`,
    });
  }

  if (input.pendingDocumentCount > 0) {
    flags.push({
      id: "JF-DOC-PENDING",
      severity: "warning",
      category: "Documents",
      message: `${input.pendingDocumentCount} document(s) not yet synced to petition`,
    });
  }

  for (const field of input.reviewFields) {
    const val = String(field.proposedValue ?? "");
    if (/^\d+\.00$/.test(val) && parseFloat(val) >= 1000) {
      if (flags.filter((f) => f.id.startsWith("JF-ROUND")).length >= 3) continue;
      flags.push({
        id: `JF-ROUND-${field.id}`,
        severity: "warning",
        category: "Schedules",
        message: `Round dollar amount ($${val}) on ${field.fieldPath} — confirm against source docs`,
        formReference: field.formId,
      });
    }
  }

  const seen = new Set<string>();
  return flags.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

export function buildFinalReviewSnapshot(input: {
  reviewFields: DemoReviewField[];
  diagnostics: MatterDiagnosticsPayload;
  chapter: "7" | "13";
  unverifiedDocumentCount: number;
  pendingDocumentCount: number;
  stored: {
    documentsQaComplete?: boolean;
    documentsQaAt?: string;
    numbersQaComplete?: boolean;
    numbersQaAt?: string;
    attorneySignOff?: boolean;
    attorneySignOffAt?: string;
    attorneyName?: string;
  };
}): FinalReviewSnapshot {
  const judgeFlags = scanJudgeFlags(input);
  const judgeErrors = judgeFlags.filter((f) => f.severity === "error").length;
  const judgeFlagsClear = judgeErrors === 0;

  const readyForGavel =
    !!input.stored.documentsQaComplete &&
    !!input.stored.numbersQaComplete &&
    !!input.stored.attorneySignOff &&
    judgeFlagsClear;

  return {
    documentsQaComplete: !!input.stored.documentsQaComplete,
    documentsQaAt: input.stored.documentsQaAt,
    numbersQaComplete: !!input.stored.numbersQaComplete,
    numbersQaAt: input.stored.numbersQaAt,
    attorneySignOff: !!input.stored.attorneySignOff,
    attorneySignOffAt: input.stored.attorneySignOffAt,
    attorneyName: input.stored.attorneyName,
    judgeFlags,
    judgeFlagsClear,
    readyForGavel,
  };
}
