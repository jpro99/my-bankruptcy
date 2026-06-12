import { describe, it, expect } from "vitest";
import { redactPii, detokenize, resetTokenCounter } from "../redaction/pii-proxy.js";

describe("PII Redaction Proxy", () => {
  it("tokenizes SSN before LLM call", () => {
    resetTokenCounter();
    const text = "Debtor SSN: 123-45-6789 filed in Fresno";
    const result = redactPii(text);
    expect(result.redactedText).not.toContain("123-45-6789");
    expect(result.redactionCount).toBeGreaterThan(0);
    expect(Object.keys(result.tokenMap).length).toBeGreaterThan(0);
  });

  it("de-tokenizes after model response inside VPC", () => {
    resetTokenCounter();
    const text = "Account 1234567890123456 balance $500";
    const { redactedText, tokenMap } = redactPii(text);
    const restored = detokenize(redactedText, tokenMap);
    expect(restored).toContain("1234567890123456");
  });

  it("redacts email and phone", () => {
    resetTokenCounter();
    const text = "Contact: john@example.com or 559-555-1234";
    const result = redactPii(text);
    expect(result.redactedText).not.toContain("john@example.com");
    expect(result.redactedText).not.toContain("559-555-1234");
    expect(result.redactionCount).toBe(2);
  });
});

describe("Field Extractor", () => {
  it("extracts income from paystub text", async () => {
    const { extractFieldsFromDocument } = await import("../extractors/field-extractor.js");
    const result = extractFieldsFromDocument({
      matterId: "00000000-0000-0000-0000-000000000001",
      firmId: "00000000-0000-0000-0000-000000000002",
      documentId: "00000000-0000-0000-0000-000000000003",
      redactedText: "Gross pay this period: $6,000.00",
      targetForm: "106I",
      promptHash: "test",
    });
    expect(result.fields.length).toBeGreaterThan(0);
    expect(result.fields[0]?.fieldPath).toBe("debtor1MonthlyIncome");
  });
});
