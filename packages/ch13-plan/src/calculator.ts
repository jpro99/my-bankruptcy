import { d, toMoney, sum, max } from "./decimal.js";

export interface SecuredClaimInput {
  id: string;
  creditorName: string;
  claimAmount: string;
  arrearage: string;
  monthlyContractPayment: string;
  interestRate?: string;
  remainingMonths?: number;
}

export interface PriorityClaimInput {
  id: string;
  creditorName: string;
  claimAmount: string;
  class: "domestic_support" | "taxes" | "other";
}

export interface PlanCalculatorInput {
  planLengthMonths: number;
  monthlyDisposableIncome: string;
  trusteeFeePercent: string;
  securedClaims: SecuredClaimInput[];
  priorityClaims: PriorityClaimInput[];
  generalUnsecuredTotal: string;
}

export interface PlanPaymentBreakdown {
  securedDirectPayments: string;
  priorityPayments: string;
  unsecuredPool: string;
  trusteeFee: string;
  totalMonthlyPlanPayment: string;
  planLengthMonths: number;
  totalPlanPayments: string;
}

/**
 * CACB F 3015-1.01 — Chapter 13 plan payment calculator
 * Computes monthly plan payment from disposable income + secured/priority obligations
 */
export function calculatePlanPayments(input: PlanCalculatorInput): PlanPaymentBreakdown {
  const months = input.planLengthMonths;
  const disposable = d(input.monthlyDisposableIncome);

  const securedDirect = sum(
    input.securedClaims.map((c) => c.monthlyContractPayment)
  );

  const totalPriority = sum(input.priorityClaims.map((c) => c.claimAmount));
  const priorityMonthly = totalPriority.dividedBy(months);

  const unsecuredPool = max(disposable.minus(securedDirect).minus(priorityMonthly), "0");

  const subtotal = securedDirect.plus(priorityMonthly).plus(unsecuredPool);
  const trusteeRate = d(input.trusteeFeePercent).dividedBy(100);
  const trusteeFee = subtotal.times(trusteeRate);
  const totalMonthly = subtotal.plus(trusteeFee);
  const totalPlan = totalMonthly.times(months);

  return {
    securedDirectPayments: toMoney(securedDirect),
    priorityPayments: toMoney(priorityMonthly),
    unsecuredPool: toMoney(unsecuredPool),
    trusteeFee: toMoney(trusteeFee),
    totalMonthlyPlanPayment: toMoney(totalMonthly),
    planLengthMonths: months,
    totalPlanPayments: toMoney(totalPlan),
  };
}

export interface BestInterestTestInput {
  /** Hypothetical Ch 7 distribution to unsecured creditors */
  chapter7HypotheticalDistribution: string;
  /** Total plan payments to unsecured creditors over plan life */
  planUnsecuredPayments: string;
  generalUnsecuredTotal: string;
}

export interface BestInterestTestResult {
  passes: boolean;
  chapter7Hypothetical: string;
  planUnsecuredTotal: string;
  surplus: string;
  rationale: string;
}

/** §1325(a)(4) — Best interests of creditors test */
export function bestInterestTest(input: BestInterestTestInput): BestInterestTestResult {
  const hypo = d(input.chapter7HypotheticalDistribution);
  const planPay = d(input.planUnsecuredPayments);
  const passes = planPay.gte(hypo);
  const surplus = planPay.minus(hypo);

  return {
    passes,
    chapter7Hypothetical: toMoney(hypo),
    planUnsecuredTotal: toMoney(planPay),
    surplus: toMoney(max(surplus, "0")),
    rationale: passes
      ? `Plan pays $${toMoney(planPay)} to unsecured creditors vs $${toMoney(hypo)} Ch 7 hypothetical — satisfies §1325(a)(4).`
      : `Plan pays $${toMoney(planPay)} but Ch 7 hypothetical is $${toMoney(hypo)} — increase plan payments or extend term.`,
  };
}

export interface PlanFeasibilityResult {
  payments: PlanPaymentBreakdown;
  bestInterest: BestInterestTestResult;
  feasible: boolean;
  recommendation: string;
}

export function evaluatePlanFeasibility(
  calcInput: PlanCalculatorInput,
  bestInterestInput: Omit<BestInterestTestInput, "planUnsecuredPayments">
): PlanFeasibilityResult {
  const payments = calculatePlanPayments(calcInput);
  const months = calcInput.planLengthMonths;
  const unsecuredTotal = d(payments.unsecuredPool).times(months);

  const bestInterest = bestInterestTest({
    ...bestInterestInput,
    planUnsecuredPayments: toMoney(unsecuredTotal),
  });

  const feasible = bestInterest.passes && parseFloat(payments.totalMonthlyPlanPayment) > 0;

  return {
    payments,
    bestInterest,
    feasible,
    recommendation: feasible
      ? `Plan is feasible at $${payments.totalMonthlyPlanPayment}/mo for ${months} months.`
      : "Plan requires adjustment — best interest test failed or zero payment.",
  };
}
