import {
  evaluateMeansTest,
  type FullMeansTestInput,
  type MeansTestEvaluation,
} from "./form-122a.js";
import {
  evaluateChapter13MeansTest,
  type FullChapter13MeansTestInput,
  type Chapter13MeansTestEvaluation,
} from "./form-122c.js";

export type Chapter = "7" | "13";

export interface UnifiedMeansTestInput {
  chapter: Chapter;
  householdSize: number;
  annualIncome: string;
  maritalAdjustment?: string;
  deductions?: FullMeansTestInput["deductions"];
}

export interface UnifiedMeansTestResult {
  chapter: Chapter;
  chapter7?: MeansTestEvaluation;
  chapter13?: Chapter13MeansTestEvaluation;
  presumptionOfAbuse: boolean;
  recommendation: "chapter_7" | "chapter_13" | "review_required";
  recommendationRationale: string;
  meansTestStatus: "pass" | "fail" | "review";
}

export function evaluateUnifiedMeansTest(
  input: UnifiedMeansTestInput
): UnifiedMeansTestResult {
  const ch7 = evaluateMeansTest({
    householdSize: input.householdSize,
    annualIncome: input.annualIncome,
    maritalAdjustment: input.maritalAdjustment,
    deductions: input.deductions,
  });

  const ch13 = evaluateChapter13MeansTest({
    householdSize: input.householdSize,
    annualIncome: input.annualIncome,
    maritalAdjustment: input.maritalAdjustment,
    deductions: input.deductions,
  });

  if (input.chapter === "7") {
    return {
      chapter: "7",
      chapter7: ch7,
      chapter13: ch13,
      presumptionOfAbuse: ch7.presumptionOfAbuse,
      recommendation: ch7.recommendation,
      recommendationRationale: ch7.rationale,
      meansTestStatus: ch7.presumptionOfAbuse ? "fail" : "pass",
    };
  }

  return {
    chapter: "13",
    chapter7: ch7,
    chapter13: ch13,
    presumptionOfAbuse: ch7.presumptionOfAbuse,
    recommendation: ch7.presumptionOfAbuse ? "chapter_13" : "review_required",
    recommendationRationale: ch7.presumptionOfAbuse
      ? "Presumption of abuse under §707(b) — Chapter 13 recommended."
      : ch13.rationale,
    meansTestStatus: "review",
  };
}

export interface MatterDiagnosticsPayload {
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
  computedAt: string;
}

export function buildDiagnosticsPayload(input: {
  meansTest: UnifiedMeansTestResult;
  missingFields?: number;
  exemptionGaps?: number;
  creditSummary?: MatterDiagnosticsPayload["creditSummary"];
}): MatterDiagnosticsPayload {
  const rec = input.meansTest.recommendation;
  const chapterRec: MatterDiagnosticsPayload["chapterRecommendation"] =
    rec === "chapter_7" ? "7" : rec === "chapter_13" ? "13" : "review";

  return {
    missingFields: input.missingFields ?? 0,
    exemptionGaps: input.exemptionGaps ?? 0,
    meansTestStatus: input.meansTest.meansTestStatus,
    presumptionOfAbuse: input.meansTest.presumptionOfAbuse,
    chapterRecommendation: chapterRec,
    recommendationRationale: input.meansTest.recommendationRationale,
    creditSummary: input.creditSummary,
    computedAt: new Date().toISOString(),
  };
}
