import { describe, expect, it } from "vitest";
import { importTestDataFromCsv, parseTestDataCsv, SAMPLE_TEST_DATA_CSV } from "../test-data-csv.js";

describe("parseTestDataCsv", () => {
  it("reads debtor, income, paystubs, w2s, and debts", () => {
    const parsed = parseTestDataCsv(SAMPLE_TEST_DATA_CSV);
    expect(parsed.fields.debtor_name).toBe("Jeffrey Russell");
    expect(parsed.fields.annual_income).toBe("72000");
    expect(parsed.paystubs).toHaveLength(3);
    expect(parsed.w2s).toHaveLength(2);
    expect(parsed.debts).toHaveLength(5);
    expect(parsed.documents.some((d) => d.documentType === "drivers_license")).toBe(true);
  });
});

describe("importTestDataFromCsv", () => {
  it("populates a fresh matter from sample CSV", () => {
    const matterId = `demo-csv-${Date.now()}`;
    const result = importTestDataFromCsv(matterId, SAMPLE_TEST_DATA_CSV);
    expect(result.debtorName).toBe("Jeffrey Russell");
    expect(result.documentsAdded).toBeGreaterThan(0);
    expect(result.debtsAdded).toBe(5);
    expect(result.consultEvaluated).toBe(true);
  });
});
