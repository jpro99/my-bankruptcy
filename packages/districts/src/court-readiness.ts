import {
  getDefaultDivision,
  getDistrictForCounty,
  getDistrictProfile,
} from "./ca-districts.js";
import type { CaliforniaDistrict } from "./types.js";

/** CACB Riverside Division — Inland Empire filing counties */
export const CACB_RIVERSIDE_DIVISION_COUNTIES = ["Riverside", "San Bernardino"] as const;

export const CACB_LOCAL_FORM_IDS = ["3015-1.7", "MML", "341"] as const;

const CH7_OFFICIAL_FORM_IDS = [
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
  "cert-counsel",
] as const;

const CH13_EXTRA_FORM_IDS = ["122C-1", "122C-2", "3015-1.01"] as const;

const FORM_LABELS: Record<string, string> = {
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
  "3015-1.01": "CACB Form 3015-1.01 — Chapter 13 Plan",
  "3015-1.7": "CACB Form 3015-1.7 — RARA",
  MML: "Creditor Matrix (MML)",
  "341": "341 Meeting Notice",
};

export type CourtConnectionStatus = "sandbox" | "live_attempt" | "not_configured";

export interface CourtReadinessForm {
  formId: string;
  label: string;
  category: "official" | "local" | "certificate" | "plan";
}

export interface CourtReadiness {
  county: string;
  district: CaliforniaDistrict;
  districtName: string;
  courtName: string;
  division: { id: string; name: string; courthouse: string };
  cmEcfBaseUrl: string;
  chapter: "7" | "13";
  requiredForms: CourtReadinessForm[];
  localFormIds: string[];
  surroundingCounties: string[];
  connections: {
    cmEcf: CourtConnectionStatus;
    localFormsInSystem: boolean;
    countyRouting: boolean;
    practiceReady: boolean;
  };
}

function formCategory(formId: string): CourtReadinessForm["category"] {
  if (formId === "3015-1.01") return "plan";
  if (formId === "cert-counsel") return "certificate";
  if (CACB_LOCAL_FORM_IDS.includes(formId as (typeof CACB_LOCAL_FORM_IDS)[number])) return "local";
  return "official";
}

/** Required petition + local forms for a CA bankruptcy district and chapter */
export function getRequiredCourtForms(
  district: CaliforniaDistrict,
  chapter: "7" | "13"
): CourtReadinessForm[] {
  const ch7Ids = [...CH7_OFFICIAL_FORM_IDS];
  const formIds =
    chapter === "13"
      ? [
          ...ch7Ids.filter((id) => !id.startsWith("122A")),
          ...CH13_EXTRA_FORM_IDS,
        ]
      : ch7Ids;

  const withLocal =
    district === "CACB" ? [...formIds, ...CACB_LOCAL_FORM_IDS] : formIds;

  return withLocal.map((formId) => ({
    formId,
    label: FORM_LABELS[formId] ?? formId,
    category: formCategory(formId),
  }));
}

function surroundingCountiesFor(
  district: CaliforniaDistrict,
  divisionId: string
): string[] {
  if (district === "CACB" && divisionId === "riverside") {
    return [...CACB_RIVERSIDE_DIVISION_COUNTIES];
  }
  return getDistrictProfile(district).primaryCounties;
}

export function getCourtReadiness(input: {
  county: string;
  chapter: "7" | "13";
  efileMode?: "sandbox" | "live";
}): CourtReadiness {
  const county = input.county.trim();
  const district = getDistrictForCounty(county);
  const profile = getDistrictProfile(district);
  const division = getDefaultDivision(district, county);
  const requiredForms = getRequiredCourtForms(district, input.chapter);
  const efileMode = input.efileMode ?? "sandbox";
  const cmEcf: CourtConnectionStatus =
    efileMode === "live" ? "live_attempt" : "sandbox";

  const localFormIds =
    district === "CACB" ? [...CACB_LOCAL_FORM_IDS] : [...profile.localFormsRequired];

  const localFormsInSystem =
    district !== "CACB" ||
    CACB_LOCAL_FORM_IDS.every((id) => requiredForms.some((f) => f.formId === id));

  const countyRouting =
    district === "CACB" &&
    CACB_RIVERSIDE_DIVISION_COUNTIES.some(
      (c) => c.toLowerCase() === county.toLowerCase()
    )
      ? division.id === "riverside"
      : true;

  return {
    county,
    district,
    districtName: profile.name,
    courtName: profile.courtName,
    division: {
      id: division.id,
      name: division.name,
      courthouse: division.courthouse,
    },
    cmEcfBaseUrl: profile.cmEcfBaseUrl,
    chapter: input.chapter,
    requiredForms,
    localFormIds,
    surroundingCounties: surroundingCountiesFor(district, division.id),
    connections: {
      cmEcf,
      localFormsInSystem,
      countyRouting,
      practiceReady: localFormsInSystem && countyRouting,
    },
  };
}
