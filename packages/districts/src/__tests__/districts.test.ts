import { describe, expect, it } from "vitest";
import {
  getDistrictForCounty,
  getDistrictProfile,
  getDefaultDivision,
  listCaliforniaDistricts,
} from "../ca-districts.js";
import { runDistrictPreflight } from "../preflight-rules.js";

describe("California districts", () => {
  it("lists all four CA bankruptcy districts", () => {
    expect(listCaliforniaDistricts()).toHaveLength(4);
  });

  it("routes Los Angeles to CACB", () => {
    expect(getDistrictForCounty("Los Angeles")).toBe("CACB");
  });

  it("routes San Francisco to CANB", () => {
    expect(getDistrictForCounty("San Francisco")).toBe("CANB");
  });

  it("routes San Diego to CASB", () => {
    expect(getDistrictForCounty("San Diego")).toBe("CASB");
  });

  it("routes Sacramento to CAEB", () => {
    expect(getDistrictForCounty("Sacramento")).toBe("CAEB");
  });

  it("defaults unknown county to CACB", () => {
    expect(getDistrictForCounty("Unknown County")).toBe("CACB");
  });

  it("picks LA division for Los Angeles county", () => {
    const div = getDefaultDivision("CACB", "Los Angeles");
    expect(div.id).toBe("la");
  });

  it("routes Riverside and San Bernardino to CACB Riverside division", () => {
    expect(getDistrictForCounty("Riverside")).toBe("CACB");
    expect(getDistrictForCounty("San Bernardino")).toBe("CACB");
    expect(getDefaultDivision("CACB", "Riverside").id).toBe("riverside");
    expect(getDefaultDivision("CACB", "San Bernardino").id).toBe("riverside");
  });

  it("CACB profile includes RARA local form", () => {
    const profile = getDistrictProfile("CACB");
    expect(profile.localFormsRequired).toContain("3015-1.7");
  });
});

describe("District preflight", () => {
  it("passes when all district requirements met", () => {
    const report = runDistrictPreflight({
      district: "CACB",
      county: "Los Angeles",
      chapter: "7",
      localFormsComplete: true,
      hasCertificateOfCreditCounseling: true,
      hasRara: true,
    });
    expect(report.errors).toBe(0);
  });

  it("flags missing RARA for CACB", () => {
    const report = runDistrictPreflight({
      district: "CACB",
      county: "Los Angeles",
      chapter: "7",
      localFormsComplete: true,
      hasCertificateOfCreditCounseling: true,
      hasRara: false,
    });
    expect(report.errors).toBeGreaterThan(0);
    expect(report.results.some((r) => r.ruleId === "DIST-005" && !r.passed)).toBe(true);
  });
});
