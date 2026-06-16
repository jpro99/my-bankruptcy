import { describe, expect, it } from "vitest";
import { generateCourtPacketPdf, generateOfficialFormPdf } from "../index.js";

describe("court-pdf", () => {
  it("generates a single official form PDF", async () => {
    const bytes = await generateOfficialFormPdf({
      formId: "101",
      label: "Voluntary Petition",
      eventCode: "PETITION",
      district: "CACB",
      divisionName: "Riverside Division",
      debtorName: "Maria Martinez",
      chapter: "7",
      watermark: "PRACTICE COPY — NOT FILED",
      fields: [
        { label: "Debtor first name", value: "Maria", status: "approved" },
        { label: "Debtor last name", value: "Martinez", status: "approved" },
      ],
    });
    expect(bytes.byteLength).toBeGreaterThan(1500);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("%PDF");
  });

  it("merges a multi-form packet", async () => {
    const bytes = await generateCourtPacketPdf({
      district: "CACB",
      divisionName: "Riverside Division",
      debtorName: "Maria Martinez",
      chapter: "7",
      watermark: "PRACTICE COPY — NOT FILED",
      pages: [
        {
          formId: "101",
          label: "Voluntary Petition",
          eventCode: "PETITION",
          fields: [{ label: "Chapter", value: "7" }],
        },
        {
          formId: "107",
          label: "Statement of Financial Affairs",
          eventCode: "SOFA",
          fields: [{ label: "Prior bankruptcy", value: "No" }],
        },
      ],
    });
    expect(bytes.byteLength).toBeGreaterThan(2000);
  });
});
