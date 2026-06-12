import { describe, it, expect } from "vitest";
import { calculatePlanPayments, bestInterestTest, evaluatePlanFeasibility } from "../calculator.js";

describe("Chapter 13 plan calculator (CACB F 3015-1.01)", () => {
  const baseInput = {
    planLengthMonths: 60,
    monthlyDisposableIncome: "3500.00",
    trusteeFeePercent: "10",
    securedClaims: [
      {
        id: "s1",
        creditorName: "Wells Fargo Mortgage",
        claimAmount: "312450.00",
        arrearage: "4200.00",
        monthlyContractPayment: "2185.00",
      },
      {
        id: "s2",
        creditorName: "Toyota Financial",
        claimAmount: "8420.00",
        arrearage: "570.00",
        monthlyContractPayment: "285.00",
      },
    ],
    priorityClaims: [
      {
        id: "p1",
        creditorName: "IRS",
        claimAmount: "3500.00",
        class: "taxes" as const,
      },
    ],
    generalUnsecuredTotal: "7414.61",
  };

  it("computes total monthly plan payment", () => {
    const result = calculatePlanPayments(baseInput);
    expect(parseFloat(result.totalMonthlyPlanPayment)).toBeGreaterThan(0);
    expect(parseFloat(result.securedDirectPayments)).toBe(2470);
  });

  it("passes best interest test when plan exceeds Ch 7 hypothetical", () => {
    const result = bestInterestTest({
      chapter7HypotheticalDistribution: "500.00",
      planUnsecuredPayments: "12000.00",
      generalUnsecuredTotal: "7414.61",
    });
    expect(result.passes).toBe(true);
  });

  it("evaluates full plan feasibility", () => {
    const result = evaluatePlanFeasibility(baseInput, {
      chapter7HypotheticalDistribution: "500.00",
      generalUnsecuredTotal: "7414.61",
    });
    expect(result.feasible).toBe(true);
    expect(result.bestInterest.passes).toBe(true);
  });
});
