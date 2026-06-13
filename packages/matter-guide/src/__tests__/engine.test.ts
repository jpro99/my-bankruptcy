import { describe, expect, it } from "vitest";
import { computeMatterProgress } from "../engine.js";

const BASE = {
  matterId: "demo",
  chapter: "7" as const,
  debtorDisplayName: "Maria Martinez",
  intakeComplete: true,
  reviewComplete: false,
  pendingFieldCount: 3,
  creditPulled: false,
  preflightReady: false,
  filed: false,
  autopilotActive: false,
  clientPortalRequestsOpen: 2,
  balanceDue: "2908.00",
};

describe("matter-guide", () => {
  it("computes partial progress for in-flight Ch 7", () => {
    const p = computeMatterProgress(BASE);
    expect(p.overallPercent).toBeGreaterThan(0);
    expect(p.overallPercent).toBeLessThan(100);
    expect(p.nextAction).toBeDefined();
  });

  it("shows plan step for Ch 13", () => {
    const p = computeMatterProgress({ ...BASE, chapter: "13" });
    expect(p.steps.some((s) => s.id === "plan")).toBe(true);
  });

  it("reaches high completion when filed", () => {
    const p = computeMatterProgress({
      ...BASE,
      reviewComplete: true,
      pendingFieldCount: 0,
      creditPulled: true,
      preflightReady: true,
      filed: true,
      autopilotActive: true,
      clientPortalRequestsOpen: 0,
      balanceDue: "0.00",
    });
    expect(p.overallPercent).toBeGreaterThanOrEqual(90);
    expect(p.readyToFile).toBe(false);
  });
});
