import { describe, expect, it } from "vitest";
import {
  buildDocumentStorageKey,
  sanitizeStorageFileName,
  sha256Hex,
} from "../document-storage.js";

describe("document-storage", () => {
  it("hashes file bytes deterministically", () => {
    const hash = sha256Hex(Buffer.from("paystub-test"));
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("sanitizes unsafe file names", () => {
    expect(sanitizeStorageFileName('Jeff Russell DL (copy).pdf')).toBe(
      "Jeff_Russell_DL_copy_.pdf"
    );
  });

  it("builds firm-scoped storage keys", () => {
    const key = buildDocumentStorageKey(
      "00000000-0000-0000-0000-000000000010",
      "demo",
      "doc-abc123",
      "paystub.pdf"
    );
    expect(key).toBe(
      "firms/00000000-0000-0000-0000-000000000010/matters/demo/documents/doc-abc123/paystub.pdf"
    );
  });
});
