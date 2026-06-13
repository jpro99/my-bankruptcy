import { createHash } from "node:crypto";
import type { BuildPackageInput, FilingDocument, FilingPackage } from "./types.js";
import { eventCodeForForm, getDistrictConfig } from "./cacb-nextgen.js";

const CH7_CORE_FORMS = [
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
  "122A-1",
  "122A-2",
];

const CH13_CORE_FORMS = [
  ...CH7_CORE_FORMS.filter((f) => !f.startsWith("122A")),
  "122C-1",
  "122C-2",
  "3015-1.01",
];

const CACB_LOCAL_FORMS = ["3015-1.7", "MML", "341"];

const FORM_LABELS: Record<string, string> = {
  "101": "Voluntary Petition",
  "106A/B": "Schedules A/B — Property",
  "106C": "Schedule C — Exemptions",
  "106D": "Schedule D — Secured Creditors",
  "106E/F": "Schedules E/F — Unsecured Creditors",
  "106G": "Schedule G — Executory Contracts",
  "106H": "Schedule H — Codebtors",
  "106I": "Schedule I — Income",
  "106J": "Schedule J — Expenses",
  "107": "Statement of Financial Affairs",
  "122A-1": "Form 122A-1 — Chapter 7 Statement of Current Monthly Income",
  "122A-2": "Form 122A-2 — Means Test Calculation",
  "122C-1": "Form 122C-1 — Chapter 13 Statement of Current Monthly Income",
  "122C-2": "Form 122C-2 — Chapter 13 Calculation",
  "3015-1.01": "CACB Form 3015-1.01 — Chapter 13 Plan",
  "3015-1.7": "CACB Form 3015-1.7 — RARA",
  MML: "Master Mailing List",
  "341": "341 Meeting Notice",
  "cert-counsel": "Credit Counseling Certificate",
  "cert-education": "Debtor Education Certificate",
};

function pseudoSha256(matterId: string, formId: string): string {
  return createHash("sha256").update(`${matterId}:${formId}:chapterai`).digest("hex");
}

function buildDocument(matterId: string, formId: string): FilingDocument {
  const label = FORM_LABELS[formId] ?? `Form ${formId}`;
  const sizeBytes = 48_000 + formId.length * 1200;
  return {
    formId,
    label,
    fileName: `form_${formId.replace(/\//g, "-")}.pdf`,
    mimeType: "application/pdf",
    sizeBytes,
    sha256: pseudoSha256(matterId, formId),
    eventCode: eventCodeForForm(formId),
    category: formId.startsWith("3015") || formId === "MML" || formId === "341"
      ? "local"
      : formId === "3015-1.01"
        ? "plan"
        : formId.startsWith("cert")
          ? "certificate"
          : "official",
  };
}

/** Assemble a CM/ECF-ready filing package from approved forms */
export function buildFilingPackage(input: BuildPackageInput): FilingPackage {
  const config = getDistrictConfig(input.district);
  const coreForms = input.chapter === "13" ? CH13_CORE_FORMS : CH7_CORE_FORMS;

  const requiredForms = new Set([
    ...coreForms,
    "cert-counsel",
    ...(input.includeLocalForms !== false && input.district === "CACB" ? CACB_LOCAL_FORMS : []),
    ...(input.includePlan && input.chapter === "13" ? ["3015-1.01"] : []),
  ]);

  const presentForms = input.approvedFormIds.filter((id) => requiredForms.has(id));
  const missingForms = [...requiredForms].filter((id) => !input.approvedFormIds.includes(id));

  // Include all approved forms that map to known codes, plus required set
  const allFormIds = [...new Set([...presentForms, ...input.approvedFormIds.filter((id) => FORM_LABELS[id])])];

  const documents = allFormIds.map((formId) => buildDocument(input.matterId, formId));

  if (documents.length === 0) {
    throw new Error("No filing documents — approve petition schedules first");
  }

  return {
    matterId: input.matterId,
    firmId: input.firmId,
    district: input.district,
    chapter: input.chapter,
    debtorDisplayName: input.debtorDisplayName,
    attorneyName: input.attorneyName,
    documents,
    metadata: {
      courtName: config.courtName,
      missingForms,
      documentCount: documents.length,
    },
  };
}

export function validatePackageForFiling(pkg: FilingPackage): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pkg.documents.some((d) => d.formId === "101")) {
    errors.push("Voluntary Petition (Form 101) is required");
  }

  if (!pkg.documents.some((d) => d.formId === "cert-counsel")) {
    warnings.push("Credit counseling certificate not in packet — may be filed separately");
  }

  if (pkg.chapter === "13" && !pkg.documents.some((d) => d.formId === "3015-1.01")) {
    errors.push("Chapter 13 Plan (CACB 3015-1.01) is required for Ch 13 filing");
  }

  const missing = (pkg.metadata?.missingForms as string[] | undefined) ?? [];
  if (missing.length > 0) {
    warnings.push(`Recommended forms not yet approved: ${missing.join(", ")}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
