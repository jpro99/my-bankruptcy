import { describe, it, expect } from "vitest";
import { classifyCreditTradelines, scheduleSummary } from "../classify.js";
import { SANDBOX_TRADELINES } from "../crs-client.js";

describe("Credit tradeline classification", () => {
  it("classifies sandbox tri-merge into D/E/F/G buckets", () => {
    const classified = classifyCreditTradelines(SANDBOX_TRADELINES);
    const summary = scheduleSummary(classified);

    expect(summary.scheduleD).toBeGreaterThanOrEqual(2);
    expect(summary.scheduleE).toBeGreaterThanOrEqual(2);
    expect(summary.scheduleF).toBeGreaterThanOrEqual(2);
    expect(summary.scheduleG).toBeGreaterThanOrEqual(2);
  });

  it("routes mortgage to Schedule D", () => {
    const [result] = classifyCreditTradelines([SANDBOX_TRADELINES[0]!]);
    expect(result!.schedule).toBe("D");
  });

  it("routes utility lease to Schedule G", () => {
    const utility = SANDBOX_TRADELINES.find((t) => t.accountType === "Utility");
    expect(utility).toBeDefined();
    const [result] = classifyCreditTradelines([utility!]);
    expect(result!.schedule).toBe("G");
  });
});
