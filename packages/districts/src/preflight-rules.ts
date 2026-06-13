import type { CaliforniaDistrict, DistrictPreflightContext, DistrictPreflightRule } from "./types.js";
import { getDistrictProfile } from "./ca-districts.js";

const BASE_DISTRICT_RULES: DistrictPreflightRule[] = [
  {
    ruleId: "DIST-001",
    category: "District",
    severity: "error",
    message: "Bankruptcy district selected",
    check: (ctx) => !!ctx.district,
  },
  {
    ruleId: "DIST-002",
    category: "District",
    severity: "error",
    message: "County of residence identified",
    check: (ctx) => ctx.county.length > 0,
  },
  {
    ruleId: "DIST-003",
    category: "District Local",
    severity: "warning",
    message: "District local forms complete",
    formReference: "local",
    check: (ctx) => ctx.localFormsComplete,
  },
  {
    ruleId: "DIST-004",
    category: "District Local",
    severity: "error",
    message: "Certificate of credit counseling attached",
    formReference: "cert-counsel",
    check: (ctx) => ctx.hasCertificateOfCreditCounseling,
  },
  {
    ruleId: "DIST-005",
    category: "District Local",
    severity: "error",
    message: "RARA (Rule 2015-1.7) on file — CACB required",
    formReference: "3015-1.7",
    check: (ctx) => ctx.district !== "CACB" || ctx.hasRara,
  },
];

const CACB_EXTRA: DistrictPreflightRule[] = [
  {
    ruleId: "CACB-MML-001",
    category: "CACB Local",
    severity: "error",
    message: "Master Mailing List (MML) prepared",
    formReference: "MML",
    check: (ctx) => ctx.district !== "CACB" || ctx.localFormsComplete,
  },
];

const CH13_PLAN_RULE: DistrictPreflightRule = {
  ruleId: "DIST-CH13-001",
  category: "District Local",
  severity: "error",
  message: "Chapter 13 plan (F 3015-1.01) required for CACB Ch 13",
  formReference: "3015-1.01",
  check: (ctx) => ctx.chapter === "7" || ctx.district !== "CACB" || ctx.localFormsComplete,
};

/** District-specific preflight rules — extends core @chapterai/preflight engine */
export function getDistrictPreflightRules(district: CaliforniaDistrict): DistrictPreflightRule[] {
  const rules = [...BASE_DISTRICT_RULES];
  if (district === "CACB") rules.push(...CACB_EXTRA);
  rules.push(CH13_PLAN_RULE);
  return rules;
}

export function runDistrictPreflight(ctx: DistrictPreflightContext): {
  district: CaliforniaDistrict;
  courtName: string;
  localFormsRequired: string[];
  results: Array<{
    ruleId: string;
    category: string;
    severity: string;
    message: string;
    formReference?: string;
    passed: boolean;
  }>;
  errors: number;
  warnings: number;
  passed: number;
} {
  const profile = getDistrictProfile(ctx.district);
  const rules = getDistrictPreflightRules(ctx.district);
  const results = rules.map((rule) => ({
    ruleId: rule.ruleId,
    category: rule.category,
    severity: rule.severity,
    message: rule.message,
    formReference: rule.formReference,
    passed: rule.check(ctx),
  }));

  return {
    district: ctx.district,
    courtName: profile.courtName,
    localFormsRequired: profile.localFormsRequired,
    results,
    errors: results.filter((r) => !r.passed && r.severity === "error").length,
    warnings: results.filter((r) => !r.passed && r.severity === "warning").length,
    passed: results.filter((r) => r.passed).length,
  };
}
