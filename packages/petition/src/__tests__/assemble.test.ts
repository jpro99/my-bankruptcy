import { describe, expect, it } from "vitest";
import { assemblePetition } from "../assemble.js";

describe("assemblePetition", () => {
  it("builds all core schedules for Martinez demo", () => {
    const view = assemblePetition({
      matterId: "demo",
      district: "CACB",
      division: "Los Angeles",
      county: "Los Angeles",
      chapter: "7",
      debtorDisplayName: "Martinez",
      reviewFields: [
        {
          id: "f1",
          fieldPath: "debtor1.firstName",
          formId: "101",
          proposedValue: "Maria",
          approvalState: "approved",
          confidence: 0.98,
          sourceDocument: { fileName: "drivers_license.pdf" },
        },
        {
          id: "f3",
          fieldPath: "debtor1MonthlyIncome",
          formId: "106I",
          proposedValue: "6000.00",
          approvalState: "pending",
          confidence: 0.94,
        },
      ],
      tradelines: [
        {
          id: "tl1",
          creditorName: "Chase Auto Finance",
          schedule: "D",
          balance: "12450.00",
          monthlyPayment: "412.00",
          confidence: 0.97,
          collateralDescription: "2019 Toyota Camry",
        },
        {
          id: "tl2",
          creditorName: "Capital One",
          schedule: "F",
          balance: "3200.00",
          confidence: 0.92,
        },
      ],
      assets: [
        {
          id: "home",
          description: "Primary residence",
          category: "homestead",
          currentValue: "685000.00",
          securedAmount: "200000.00",
          exemptionSystem: "System 2",
          exemptionAmount: "685000.00",
        },
      ],
    });

    expect(view.schedules.length).toBeGreaterThanOrEqual(8);
    expect(view.schedules.find((s) => s.formId === "106D")?.itemCount).toBe(1);
    expect(view.schedules.find((s) => s.formId === "106E/F")?.itemCount).toBe(1);
    expect(view.overallCompletion).toBeGreaterThan(0);
    expect(view.district).toBe("CACB");
  });
});
