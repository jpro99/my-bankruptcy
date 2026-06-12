import { describe, it, expect } from "vitest";
import { ScheduleEFCreditorSchema, computeScheduleEFTotals } from "../schedules/schedule-e-f.js";

describe("Schedule E/F Creditor Schema", () => {
  it("validates a nonpriority unsecured creditor", () => {
    const creditor = ScheduleEFCreditorSchema.parse({
      creditorNumber: 1,
      creditorName: "Capital One Bank",
      creditorAddress: {
        street1: "1680 Capital One Dr",
        city: "McLean",
        state: "VA",
        zip: "22102",
      },
      claimType: "nonpriority_unsecured",
      totalClaimAmount: "4523.17",
    });
    expect(creditor.claimType).toBe("nonpriority_unsecured");
  });

  it("computes schedule totals", () => {
    const creditors = [
      ScheduleEFCreditorSchema.parse({
        creditorNumber: 1,
        creditorName: "IRS",
        creditorAddress: { street1: "1", city: "DC", state: "DC", zip: "20001" },
        claimType: "priority_unsecured",
        priorityClass: "taxes",
        totalClaimAmount: "3500.00",
      }),
      ScheduleEFCreditorSchema.parse({
        creditorNumber: 2,
        creditorName: "Chase",
        creditorAddress: { street1: "1", city: "NY", state: "NY", zip: "10001" },
        claimType: "nonpriority_unsecured",
        totalClaimAmount: "8200.00",
      }),
    ];
    const totals = computeScheduleEFTotals(creditors);
    expect(totals.totalPriority).toBe("3500.00");
    expect(totals.totalNonpriority).toBe("8200.00");
  });
});
