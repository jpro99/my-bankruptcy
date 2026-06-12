import { d, toMoney, sum, max } from "./decimal.js";
import { getCaliforniaMedianIncome } from "./tables/california-2025.js";

export interface Form122A1Input {
  householdSize: number;
  /** Annual gross income (CMI — Current Monthly Income × 12) */
  annualIncome: string;
  /** Marital adjustment: portion of non-filing spouse income not attributed to debtor */
  maritalAdjustment?: string;
}

export interface Form122A1Result {
  annualIncome: string;
  maritalAdjustment: string;
  adjustedAnnualIncome: string;
  stateMedianIncome: string;
  isBelowMedian: boolean;
  presumptionOfAbuse: boolean;
  form122A2Required: boolean;
  monthlyIncome: string;
  monthlyIncomeAnnualized: string;
}

/**
 * Form 122A-1 — Chapter 7 Statement of Current Monthly Income
 * Determines if debtor is below state median → no presumption of abuse
 */
export function computeForm122A1(input: Form122A1Input): Form122A1Result {
  const maritalAdj = input.maritalAdjustment ?? "0";
  const adjustedAnnual = d(input.annualIncome).minus(maritalAdj);
  const median = d(getCaliforniaMedianIncome(input.householdSize));
  const isBelowMedian = adjustedAnnual.lte(median);
  const monthlyIncome = d(input.annualIncome).dividedBy(12);

  return {
    annualIncome: toMoney(d(input.annualIncome)),
    maritalAdjustment: toMoney(d(maritalAdj)),
    adjustedAnnualIncome: toMoney(adjustedAnnual),
    stateMedianIncome: toMoney(median),
    isBelowMedian,
    presumptionOfAbuse: !isBelowMedian,
    form122A2Required: !isBelowMedian,
    monthlyIncome: toMoney(monthlyIncome),
    monthlyIncomeAnnualized: toMoney(monthlyIncome.times(12)),
  };
}

export interface Form122A2Deductions {
  /** Line 13 — Living expenses (national + local standards or actual) */
  livingExpenses: string;
  /** Line 14 — Payments on secured debts */
  securedDebtPayments: string;
  /** Line 15 — Priority claims (domestic support, etc.) */
  priorityClaims: string;
  /** Line 16 — Chapter 13 administrative expenses */
  chapter13AdminExpenses: string;
  /** Line 17 — Qualified retirement contributions */
  retirementContributions: string;
  /** Line 18 — Domestic support obligations */
  domesticSupport: string;
  /** Line 19 — Expenses from Schedule J (special circumstances) */
  specialCircumstancesExpenses: string;
  /** Line 20 — Health insurance / disability / health savings */
  healthInsurance: string;
  /** Line 21 — Care of elderly/disabled/household members */
  careExpenses: string;
  /** Line 22 — Protection from domestic violence */
  domesticViolenceExpenses: string;
  /** Line 23 — Continued contributions to charity */
  charitableContributions: string;
  /** Line 24 — Educational expenses for dependent children */
  educationalExpenses: string;
  /** Line 25 — Other adjustments */
  otherAdjustments: string;
}

export interface Form122A2Input {
  householdSize: number;
  monthlyIncome: string;
  deductions: Form122A2Deductions;
}

export interface Form122A2Result {
  monthlyIncome: string;
  totalDeductions: string;
  monthlyDisposableIncome: string;
  disposableIncome60Months: string;
  presumptionOfAbuse: boolean;
  /** If disposable × 60 > $9,075 (2025 threshold) OR disposable > $151.25/mo */
  abuseThreshold60Months: string;
  abuseThresholdMonthly: string;
}

/** 2025 §707(b) presumption thresholds (11 U.S.C. § 707(b)(2)(A)(i)) */
export const ABUSE_THRESHOLD_60_MONTHS = "9075";
export const ABUSE_THRESHOLD_MONTHLY = "151.25";

/**
 * Form 122A-2 — Means Test Calculation (Chapter 7)
 * Required when 122A-1 shows income above median
 */
export function computeForm122A2(input: Form122A2Input): Form122A2Result {
  const income = d(input.monthlyIncome);
  const ded = input.deductions;

  const totalDeductions = sum([
    ded.livingExpenses,
    ded.securedDebtPayments,
    ded.priorityClaims,
    ded.chapter13AdminExpenses,
    ded.retirementContributions,
    ded.domesticSupport,
    ded.specialCircumstancesExpenses,
    ded.healthInsurance,
    ded.careExpenses,
    ded.domesticViolenceExpenses,
    ded.charitableContributions,
    ded.educationalExpenses,
    ded.otherAdjustments,
  ]);

  const disposable = max(income.minus(totalDeductions), "0");
  const disposable60 = disposable.times(60);
  const threshold60 = d(ABUSE_THRESHOLD_60_MONTHS);
  const thresholdMonthly = d(ABUSE_THRESHOLD_MONTHLY);

  const presumptionOfAbuse =
    disposable60.gt(threshold60) && disposable.gt(thresholdMonthly);

  return {
    monthlyIncome: toMoney(income),
    totalDeductions: toMoney(totalDeductions),
    monthlyDisposableIncome: toMoney(disposable),
    disposableIncome60Months: toMoney(disposable60),
    presumptionOfAbuse,
    abuseThreshold60Months: ABUSE_THRESHOLD_60_MONTHS,
    abuseThresholdMonthly: ABUSE_THRESHOLD_MONTHLY,
  };
}

export interface MeansTestEvaluation {
  form122A1: Form122A1Result;
  form122A2?: Form122A2Result;
  chapter7Eligible: boolean;
  presumptionOfAbuse: boolean;
  recommendation: "chapter_7" | "chapter_13" | "review_required";
  rationale: string;
}

export interface FullMeansTestInput {
  householdSize: number;
  annualIncome: string;
  maritalAdjustment?: string;
  deductions?: Form122A2Deductions;
}

/**
 * Full means test evaluation — combines 122A-1 and 122A-2
 */
export function evaluateMeansTest(input: FullMeansTestInput): MeansTestEvaluation {
  const form122A1 = computeForm122A1({
    householdSize: input.householdSize,
    annualIncome: input.annualIncome,
    maritalAdjustment: input.maritalAdjustment,
  });

  if (form122A1.isBelowMedian) {
    return {
      form122A1,
      chapter7Eligible: true,
      presumptionOfAbuse: false,
      recommendation: "chapter_7",
      rationale:
        "Current monthly income is below the California median for household size. " +
        "No presumption of abuse under §707(b). Chapter 7 filing permitted.",
    };
  }

  const defaultDeductions: Form122A2Deductions = {
    livingExpenses: "0",
    securedDebtPayments: "0",
    priorityClaims: "0",
    chapter13AdminExpenses: "0",
    retirementContributions: "0",
    domesticSupport: "0",
    specialCircumstancesExpenses: "0",
    healthInsurance: "0",
    careExpenses: "0",
    domesticViolenceExpenses: "0",
    charitableContributions: "0",
    educationalExpenses: "0",
    otherAdjustments: "0",
  };

  const form122A2 = computeForm122A2({
    householdSize: input.householdSize,
    monthlyIncome: form122A1.monthlyIncome,
    deductions: input.deductions ?? defaultDeductions,
  });

  const chapter7Eligible = !form122A2.presumptionOfAbuse;

  return {
    form122A1,
    form122A2,
    chapter7Eligible,
    presumptionOfAbuse: form122A2.presumptionOfAbuse,
    recommendation: chapter7Eligible ? "chapter_7" : "chapter_13",
    rationale: chapter7Eligible
      ? "Income exceeds median but means test deductions reduce disposable income below abuse thresholds. Chapter 7 permitted."
      : "Presumption of abuse arises under §707(b)(2). Recommend Chapter 13 or rebuttal with special circumstances.",
  };
}
