import { describe, expect, it } from "vitest";
import { buildFilingPackage, validatePackageForFiling } from "../package-builder.js";
import { submitSandboxFiling } from "../sandbox-filer.js";
import { submitToCmEcf } from "../index.js";

const BASE_INPUT = {
  matterId: "demo",
  firmId: "00000000-0000-0000-0000-000000000010",
  district: "CACB" as const,
  chapter: "7" as const,
  debtorDisplayName: "Maria Martinez",
  attorneyName: "Dev Attorney",
  approvedFormIds: [
    "101",
    "106A/B",
    "106C",
    "106D",
    "106E/F",
    "106G",
    "106H",
    "106I",
    "106J",
    "107",
    "122A-1",
    "122A-2",
    "cert-counsel",
    "3015-1.7",
    "MML",
  ],
};

describe("buildFilingPackage", () => {
  it("assembles Ch 7 CACB packet with local forms", () => {
    const pkg = buildFilingPackage(BASE_INPUT);
    expect(pkg.documents.length).toBeGreaterThanOrEqual(12);
    expect(pkg.documents.some((d) => d.formId === "101")).toBe(true);
    expect(pkg.documents.some((d) => d.formId === "3015-1.7")).toBe(true);
  });

  it("requires Ch 13 plan for chapter 13", () => {
    const pkg = buildFilingPackage({
      ...BASE_INPUT,
      chapter: "13",
      approvedFormIds: [...BASE_INPUT.approvedFormIds, "122C-1", "122C-2"],
    });
    const validation = validatePackageForFiling(pkg);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("3015-1.01"))).toBe(true);
  });
});

describe("submitSandboxFiling", () => {
  it("returns case number and receipt in sandbox mode", async () => {
    const pkg = buildFilingPackage({
      ...BASE_INPUT,
      approvedFormIds: [...BASE_INPUT.approvedFormIds, "3015-1.01"],
    });
    const result = await submitSandboxFiling(pkg, { delayMs: 0 });
    expect(result.status).toBe("filed");
    expect(result.caseNumber).toMatch(/^\d:\d{2}-bk-\d+/);
    expect(result.receiptNumber).toMatch(/^CACB-/);
    expect(result.documentsFiled).toBe(pkg.documents.length);
  });
});

describe("submitToCmEcf", () => {
  it("defaults to sandbox without credentials", async () => {
    const pkg = buildFilingPackage(BASE_INPUT);
    const result = await submitToCmEcf(pkg);
    expect(result.mode).toBe("sandbox");
  });
});
