import { describe, it, expect } from "vitest";
import {
  optimizeExemptions,
  simulateExemptionSystem,
  SYSTEM2_HOMESTEAD_FLOOR,
} from "../optimizer.js";
import {
  FACT_PATTERN_GARCIA,
  FACT_PATTERN_NGUYEN,
} from "./fixtures/california-fact-patterns.js";
import { d } from "../decimal.js";

describe("Exemption Optimizer — Fact Pattern Garcia (homeowner)", () => {
  const fp = FACT_PATTERN_GARCIA;

  it("System 2 exempts homestead up to statutory floor for under-65 debtor", () => {
    const system2 = simulateExemptionSystem("system2", fp.assets);
    const homesteadClaim = system2.claims.find((c) => c.category === "homestead");
    expect(homesteadClaim).toBeDefined();
    expect(homesteadClaim!.exemptAmount).toBe(fp.expected.system2HomesteadExemptMin);
  });

  it("retirement is fully exempt under both systems", () => {
    const system1 = simulateExemptionSystem("system1", fp.assets);
    const system2 = simulateExemptionSystem("system2", fp.assets);
    const ret1 = system1.claims.find((c) => c.category === "retirement");
    const ret2 = system2.claims.find((c) => c.category === "retirement");
    expect(ret1!.nonexemptAmount).toBe("0.00");
    expect(ret2!.nonexemptAmount).toBe("0.00");
  });

  it("recommends System 2 for high-equity Sacramento homeowner", () => {
    const result = optimizeExemptions(fp.assets);
    expect(result.recommendedSystem).toBe(fp.expected.recommendedSystem);
    expect(parseFloat(result.system2.totalNonexempt)).toBeLessThanOrEqual(
      parseFloat(result.system1.totalNonexempt)
    );
  });

  it("provides written rationale", () => {
    const result = optimizeExemptions(fp.assets);
    expect(result.rationale).toContain("System 2");
    expect(result.rationale.length).toBeGreaterThan(50);
  });
});

describe("Exemption Optimizer — Fact Pattern Nguyen (renter)", () => {
  const fp = FACT_PATTERN_NGUYEN;

  it("System 2 provides higher motor vehicle exemption", () => {
    const system1 = simulateExemptionSystem("system1", fp.assets);
    const system2 = simulateExemptionSystem("system2", fp.assets);
    const vehicle1 = system1.claims.find((c) => c.category === "motor_vehicle");
    const vehicle2 = system2.claims.find((c) => c.category === "motor_vehicle");
    expect(parseFloat(vehicle2!.exemptAmount)).toBeGreaterThan(
      parseFloat(vehicle1!.exemptAmount)
    );
  });

  it("recommends System 2 for renter with vehicle and tools", () => {
    const result = optimizeExemptions(fp.assets);
    expect(result.recommendedSystem).toBe("system2");
  });

  it("System 2 total non-exempt is within expected range", () => {
    const result = optimizeExemptions(fp.assets);
    expect(parseFloat(result.system2.totalNonexempt)).toBeLessThanOrEqual(
      parseFloat(fp.expected.totalNonexemptSystem2Max)
    );
  });

  it("calculates savings advantage between systems", () => {
    const result = optimizeExemptions(fp.assets);
    expect(parseFloat(result.savingsAdvantage)).toBeGreaterThan(0);
  });
});

describe("Homestead floor/cap constants", () => {
  it("uses 2025/2026 indexed homestead values", () => {
    expect(SYSTEM2_HOMESTEAD_FLOOR).toBe("361076.00");
  });

  it("System 2 homestead exempts full equity when below statutory limit", () => {
    const assets = [
      {
        id: "home",
        category: "homestead" as const,
        description: "Low equity home",
        currentValue: "200000.00",
        equity: "50000.00",
      },
    ];
    const system2 = simulateExemptionSystem("system2", assets);
    expect(system2.claims[0]!.exemptAmount).toBe("50000.00");
    expect(system2.claims[0]!.nonexemptAmount).toBe("0.00");
  });
});

describe("Dual simulation comparison", () => {
  it("always returns both system results", () => {
    const result = optimizeExemptions(FACT_PATTERN_NGUYEN.assets);
    expect(result.system1.system).toBe("system1");
    expect(result.system2.system).toBe("system2");
    expect(result.system1.claims.length).toBe(FACT_PATTERN_NGUYEN.assets.length);
    expect(result.system2.claims.length).toBe(FACT_PATTERN_NGUYEN.assets.length);
  });

  it("total asset value is consistent across systems", () => {
    const result = optimizeExemptions(FACT_PATTERN_GARCIA.assets);
    expect(result.system1.totalAssetValue).toBe(result.system2.totalAssetValue);
  });
});
