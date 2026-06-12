import { describe, it, expect } from "vitest";
import {
  computeForm122A1,
  computeForm122A2,
  evaluateMeansTest,
  ABUSE_THRESHOLD_60_MONTHS,
  ABUSE_THRESHOLD_MONTHLY,
} from "../form-122a.js";
import { getCaliforniaMedianIncome } from "../tables/california-2025.js";
import {
  FACT_PATTERN_MARTINEZ,
  FACT_PATTERN_CHEN,
  FACT_PATTERN_WILLIAMS,
} from "./fixtures/california-fact-patterns.js";

describe("California median income tables (2025)", () => {
  it("returns correct median for household size 1", () => {
    expect(getCaliforniaMedianIncome(1)).toBe("71957");
  });

  it("returns correct median for household size 2", () => {
    expect(getCaliforniaMedianIncome(2)).toBe("93175");
  });

  it("caps lookup at 8 and adds per-person for larger households", () => {
    const median8 = getCaliforniaMedianIncome(8);
    const median10 = getCaliforniaMedianIncome(10);
    expect(parseFloat(median10)).toBeGreaterThan(parseFloat(median8));
  });
});

describe("Form 122A-1 — Fact Pattern Martinez (below median)", () => {
  const fp = FACT_PATTERN_MARTINEZ;

  it("computes monthly income correctly", () => {
    const result = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    expect(result.monthlyIncome).toBe(fp.expected.monthlyIncome);
  });

  it("identifies income below California median", () => {
    const result = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    expect(result.isBelowMedian).toBe(fp.expected.isBelowMedian);
    expect(result.stateMedianIncome).toBe(fp.expected.stateMedianIncome);
  });

  it("does not trigger presumption of abuse", () => {
    const result = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    expect(result.presumptionOfAbuse).toBe(false);
    expect(result.form122A2Required).toBe(false);
  });

  it("full evaluation recommends Chapter 7", () => {
    const evaluation = evaluateMeansTest({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    expect(evaluation.recommendation).toBe("chapter_7");
    expect(evaluation.chapter7Eligible).toBe(true);
    expect(evaluation.form122A2).toBeUndefined();
  });
});

describe("Form 122A-2 — Fact Pattern Chen (above median, passes means test)", () => {
  const fp = FACT_PATTERN_CHEN;

  it("requires Form 122A-2 completion", () => {
    const result = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    expect(result.isBelowMedian).toBe(false);
    expect(result.form122A2Required).toBe(true);
  });

  it("passes means test after allowable deductions", () => {
    const a1 = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    const a2 = computeForm122A2({
      householdSize: fp.householdSize,
      monthlyIncome: a1.monthlyIncome,
      deductions: fp.deductions,
    });
    expect(a2.presumptionOfAbuse).toBe(false);
    expect(parseFloat(a2.monthlyDisposableIncome)).toBeLessThanOrEqual(
      parseFloat(ABUSE_THRESHOLD_MONTHLY)
    );
  });

  it("full evaluation recommends Chapter 7 despite above-median income", () => {
    const evaluation = evaluateMeansTest({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
      deductions: fp.deductions,
    });
    expect(evaluation.recommendation).toBe("chapter_7");
    expect(evaluation.presumptionOfAbuse).toBe(false);
    expect(evaluation.form122A2).toBeDefined();
  });
});

describe("Form 122A-2 — Fact Pattern Williams (presumption of abuse)", () => {
  const fp = FACT_PATTERN_WILLIAMS;

  it("income exceeds median for single-person household", () => {
    const result = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    expect(result.isBelowMedian).toBe(false);
    expect(result.stateMedianIncome).toBe(fp.expected.stateMedianIncome);
  });

  it("triggers presumption of abuse with minimal deductions", () => {
    const a1 = computeForm122A1({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
    });
    const a2 = computeForm122A2({
      householdSize: fp.householdSize,
      monthlyIncome: a1.monthlyIncome,
      deductions: fp.deductions,
    });
    expect(a2.presumptionOfAbuse).toBe(true);
    expect(parseFloat(a2.disposableIncome60Months)).toBeGreaterThan(
      parseFloat(ABUSE_THRESHOLD_60_MONTHS)
    );
  });

  it("full evaluation recommends Chapter 13", () => {
    const evaluation = evaluateMeansTest({
      householdSize: fp.householdSize,
      annualIncome: fp.annualIncome,
      deductions: fp.deductions,
    });
    expect(evaluation.recommendation).toBe("chapter_13");
    expect(evaluation.presumptionOfAbuse).toBe(true);
    expect(evaluation.chapter7Eligible).toBe(false);
  });
});

describe("§707(b) abuse thresholds", () => {
  it("uses 2025 statutory thresholds", () => {
    expect(ABUSE_THRESHOLD_60_MONTHS).toBe("9075");
    expect(ABUSE_THRESHOLD_MONTHLY).toBe("151.25");
  });
});
