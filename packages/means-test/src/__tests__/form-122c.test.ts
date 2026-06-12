import { describe, it, expect } from "vitest";
import { evaluateChapter13MeansTest } from "../form-122c.js";
import { evaluateUnifiedMeansTest, buildDiagnosticsPayload } from "../diagnostics.js";

describe("Form 122C — Chapter 13 means test", () => {
  it("computes disposable income for above-median debtor", () => {
    const result = evaluateChapter13MeansTest({
      householdSize: 2,
      annualIncome: "98400.00",
      deductions: {
        livingExpenses: "3850.00",
        securedDebtPayments: "2100.00",
        priorityClaims: "350.00",
        retirementContributions: "200.00",
        domesticSupport: "350.00",
        healthInsurance: "520.00",
        careExpenses: "150.00",
        charitableContributions: "0.00",
        educationalExpenses: "100.00",
        otherAdjustments: "0.00",
      },
    });

    expect(result.form122C1.form122C2Required).toBe(true);
    expect(parseFloat(result.monthlyPlanPaymentFloor)).toBeGreaterThan(0);
  });
});

describe("Unified means test diagnostics", () => {
  it("builds diagnostics payload with presumption of abuse flag", () => {
    const meansTest = evaluateUnifiedMeansTest({
      chapter: "7",
      householdSize: 1,
      annualIncome: "145000.00",
      deductions: {
        livingExpenses: "2100.00",
        securedDebtPayments: "450.00",
        priorityClaims: "0.00",
        chapter13AdminExpenses: "0.00",
        retirementContributions: "0.00",
        domesticSupport: "0.00",
        specialCircumstancesExpenses: "0.00",
        healthInsurance: "350.00",
        careExpenses: "0.00",
        domesticViolenceExpenses: "0.00",
        charitableContributions: "0.00",
        educationalExpenses: "0.00",
        otherAdjustments: "0.00",
      },
    });

    const diagnostics = buildDiagnosticsPayload({ meansTest });
    expect(diagnostics.presumptionOfAbuse).toBe(true);
    expect(diagnostics.chapterRecommendation).toBe("13");
  });
});
