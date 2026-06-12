import { describe, it, expect } from "vitest";
import { runPreflight, PREFLIGHT_RULE_COUNT } from "../engine.js";

describe("Preflight engine (God Button)", () => {
  it("blocks Ch 7 filing when fields pending", () => {
    const report = runPreflight({
      matterId: "demo",
      chapter: "7",
      district: "CACB",
      hasDebtor1: true,
      hasIncomeSchedule: true,
      hasExpenseSchedule: true,
      pendingFieldCount: 5,
      presumptionOfAbuse: false,
      exemptionGaps: 0,
      creditPulled: true,
    });
    expect(report.readyToFile).toBe(false);
    expect(report.errors).toBeGreaterThan(0);
  });

  it("allows Ch 7 when all rules pass", () => {
    const report = runPreflight({
      matterId: "demo",
      chapter: "7",
      district: "CACB",
      hasDebtor1: true,
      hasIncomeSchedule: true,
      hasExpenseSchedule: true,
      pendingFieldCount: 0,
      presumptionOfAbuse: false,
      exemptionGaps: 0,
      creditPulled: true,
      localFormsComplete: true,
    });
    expect(report.readyToFile).toBe(true);
  });

  it("requires plan feasibility for Ch 13", () => {
    const report = runPreflight({
      matterId: "demo",
      chapter: "13",
      district: "CACB",
      hasDebtor1: true,
      hasIncomeSchedule: true,
      hasExpenseSchedule: true,
      pendingFieldCount: 0,
      presumptionOfAbuse: false,
      exemptionGaps: 0,
      creditPulled: true,
      planFeasible: false,
      bestInterestPassed: false,
    });
    expect(report.readyToFile).toBe(false);
  });

  it("has extensible rule registry", () => {
    expect(PREFLIGHT_RULE_COUNT).toBeGreaterThanOrEqual(10);
  });
});
