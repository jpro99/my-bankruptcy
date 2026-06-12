import { d, toMoney, sum, max } from "./decimal.js";
import { getCaliforniaMedianIncome } from "./tables/california-2025.js";

export interface Form122C1Input {
  householdSize: number;
  annualIncome: string;
  maritalAdjustment?: string;
}

export interface Form122C1Result {
  annualIncome: string;
  adjustedAnnualIncome: string;
  stateMedianIncome: string;
  isBelowMedian: boolean;
  monthlyIncome: string;
  form122C2Required: boolean;
}

/** Form 122C-1 — Chapter 13 Statement of Current Monthly Income */
export function computeForm122C1(input: Form122C1Input): Form122C1Result {
  const maritalAdj = input.maritalAdjustment ?? "0";
  const adjustedAnnual = d(input.annualIncome).minus(maritalAdj);
  const median = d(getCaliforniaMedianIncome(input.householdSize));
  const isBelowMedian = adjustedAnnual.lte(median);
  const monthlyIncome = d(input.annualIncome).dividedBy(12);

  return {
    annualIncome: toMoney(d(input.annualIncome)),
    adjustedAnnualIncome: toMoney(adjustedAnnual),
    stateMedianIncome: toMoney(median),
    isBelowMedian,
    monthlyIncome: toMoney(monthlyIncome),
    form122C2Required: !isBelowMedian,
  };
}

export interface Form122C2Deductions {
  livingExpenses: string;
  securedDebtPayments: string;
  priorityClaims: string;
  retirementContributions: string;
  domesticSupport: string;
  healthInsurance: string;
  careExpenses: string;
  charitableContributions: string;
  educationalExpenses: string;
  otherAdjustments: string;
}

export interface Form122C2Input {
  monthlyIncome: string;
  deductions: Form122C2Deductions;
}

export interface Form122C2Result {
  monthlyIncome: string;
  totalDeductions: string;
  monthlyDisposableIncome: string;
  disposableIncome60Months: string;
}

/** Form 122C-2 — Chapter 13 Calculation of Disposable Income */
export function computeForm122C2(input: Form122C2Input): Form122C2Result {
  const income = d(input.monthlyIncome);
  const ded = input.deductions;

  const totalDeductions = sum([
    ded.livingExpenses,
    ded.securedDebtPayments,
    ded.priorityClaims,
    ded.retirementContributions,
    ded.domesticSupport,
    ded.healthInsurance,
    ded.careExpenses,
    ded.charitableContributions,
    ded.educationalExpenses,
    ded.otherAdjustments,
  ]);

  const disposable = max(income.minus(totalDeductions), "0");

  return {
    monthlyIncome: toMoney(income),
    totalDeductions: toMoney(totalDeductions),
    monthlyDisposableIncome: toMoney(disposable),
    disposableIncome60Months: toMoney(disposable.times(60)),
  };
}

export interface Chapter13MeansTestEvaluation {
  form122C1: Form122C1Result;
  form122C2?: Form122C2Result;
  monthlyPlanPaymentFloor: string;
  recommendation: "chapter_13_feasible" | "review_required";
  rationale: string;
}

export interface FullChapter13MeansTestInput {
  householdSize: number;
  annualIncome: string;
  maritalAdjustment?: string;
  deductions?: Form122C2Deductions;
}

export function evaluateChapter13MeansTest(
  input: FullChapter13MeansTestInput
): Chapter13MeansTestEvaluation {
  const form122C1 = computeForm122C1({
    householdSize: input.householdSize,
    annualIncome: input.annualIncome,
    maritalAdjustment: input.maritalAdjustment,
  });

  const defaultDeductions: Form122C2Deductions = {
    livingExpenses: "0",
    securedDebtPayments: "0",
    priorityClaims: "0",
    retirementContributions: "0",
    domesticSupport: "0",
    healthInsurance: "0",
    careExpenses: "0",
    charitableContributions: "0",
    educationalExpenses: "0",
    otherAdjustments: "0",
  };

  const form122C2 = computeForm122C2({
    monthlyIncome: form122C1.monthlyIncome,
    deductions: input.deductions ?? defaultDeductions,
  });

  return {
    form122C1,
    form122C2,
    monthlyPlanPaymentFloor: form122C2.monthlyDisposableIncome,
    recommendation: "chapter_13_feasible",
    rationale: form122C1.isBelowMedian
      ? "Below median income — 3-year plan may be available under §1325(b)(4)."
      : `Disposable income of $${form122C2.monthlyDisposableIncome}/mo establishes Chapter 13 plan payment floor.`,
  };
}
