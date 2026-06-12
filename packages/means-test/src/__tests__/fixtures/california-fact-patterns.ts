/**
 * Anonymized California bankruptcy fact patterns for means test validation.
 * Replace with firm-provided golden cases when available.
 */

/** Fact Pattern A — Martinez (Fresno, CACB)
 * Joint filers, household of 2, combined W-2 income below CA median.
 * Expected: Pass 122A-1, no 122A-2 required, Ch 7 eligible.
 */
export const FACT_PATTERN_MARTINEZ = {
  id: "martinez-2025-cacb",
  description:
    "Married joint filers, Fresno CA, 2-person household, combined annual income $72,000",
  householdSize: 2,
  annualIncome: "72000.00",
  maritalAdjustment: "0.00",
  deductions: {
    livingExpenses: "3200.00",
    securedDebtPayments: "1850.00", // mortgage + auto
    priorityClaims: "0.00",
    chapter13AdminExpenses: "0.00",
    retirementContributions: "0.00",
    domesticSupport: "0.00",
    specialCircumstancesExpenses: "0.00",
    healthInsurance: "450.00",
    careExpenses: "0.00",
    domesticViolenceExpenses: "0.00",
    charitableContributions: "0.00",
    educationalExpenses: "0.00",
    otherAdjustments: "0.00",
  },
  expected: {
    isBelowMedian: true,
    form122A2Required: false,
    presumptionOfAbuse: false,
    recommendation: "chapter_7" as const,
    stateMedianIncome: "93175.00",
    monthlyIncome: "6000.00",
  },
};

/** Fact Pattern B — Chen (Sacramento, CACB)
 * Single filer, 1 dependent (HH size 2), income above median.
 * High secured debt + IRS standard deductions → passes 122A-2.
 * Expected: 122A-2 required, no presumption of abuse after deductions.
 */
export const FACT_PATTERN_CHEN = {
  id: "chen-2025-cacb",
  description:
    "Single filer with 1 dependent, Sacramento CA, 2-person household, annual income $98,400",
  householdSize: 2,
  annualIncome: "98400.00",
  maritalAdjustment: "0.00",
  deductions: {
    livingExpenses: "4500.00",
    securedDebtPayments: "2800.00", // mortgage + vehicle + furniture
    priorityClaims: "350.00",
    chapter13AdminExpenses: "0.00",
    retirementContributions: "200.00",
    domesticSupport: "350.00",
    specialCircumstancesExpenses: "0.00",
    healthInsurance: "520.00",
    careExpenses: "150.00",
    domesticViolenceExpenses: "0.00",
    charitableContributions: "0.00",
    educationalExpenses: "100.00",
    otherAdjustments: "0.00",
  },
  expected: {
    isBelowMedian: false,
    form122A2Required: true,
    presumptionOfAbuse: false,
    recommendation: "chapter_7" as const,
    stateMedianIncome: "93175.00",
    monthlyIncome: "8200.00",
    monthlyDisposableIncomeMax: "151.25", // must be at or below to avoid abuse
  },
};

/** Fact Pattern C — Williams (high income, presumption of abuse)
 * Single filer, no dependents, high income, minimal deductions.
 */
export const FACT_PATTERN_WILLIAMS = {
  id: "williams-2025-cacb",
  description:
    "Single filer, no dependents, Los Angeles CA, annual income $145,000, minimal deductions",
  householdSize: 1,
  annualIncome: "145000.00",
  maritalAdjustment: "0.00",
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
  expected: {
    isBelowMedian: false,
    form122A2Required: true,
    presumptionOfAbuse: true,
    recommendation: "chapter_13" as const,
    stateMedianIncome: "71957.00",
    monthlyIncome: "12083.33",
  },
};
