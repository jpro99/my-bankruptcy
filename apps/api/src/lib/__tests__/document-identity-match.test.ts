import { describe, expect, it } from "vitest";
import {
  buildUploadMatchPreview,
  extractIdentityFromDocument,
  namesMatch,
} from "../document-identity-match.js";

describe("extractIdentityFromDocument", () => {
  it("reads Jeff Russell from driver's license filename", () => {
    const id = extractIdentityFromDocument("Jeff_Russell_drivers_license.jpg", "drivers_license");
    expect(id.fullName).toBe("Jeff Russell");
    expect(id.confidence).toBeGreaterThan(0.5);
  });

  it("reads comma format", () => {
    const id = extractIdentityFromDocument("Russell, Jeff DL.pdf", "drivers_license");
    expect(id.fullName).toBe("Jeff Russell");
  });
});

describe("buildUploadMatchPreview", () => {
  const matters = [
    {
      matterId: "demo",
      debtorDisplayName: "Maria Martinez",
    },
    {
      matterId: "demo-jeff",
      debtorDisplayName: "Jeff Russell",
      clientFirstName: "Jeff",
      clientLastName: "Russell",
    },
  ];

  it("flags wrong matter for Jeff's license on Maria's file", () => {
    const preview = buildUploadMatchPreview(
      matters,
      "demo",
      "Jeff_Russell_license.jpg",
      "drivers_license"
    );
    expect(preview.action).toBe("confirm");
    expect(preview.bestMatch?.matterId).toBe("demo-jeff");
  });

  it("proceeds when names align", () => {
    const preview = buildUploadMatchPreview(
      matters,
      "demo-jeff",
      "Jeff Russell ID.jpg",
      "drivers_license"
    );
    expect(preview.action).toBe("proceed");
  });
});

describe("namesMatch", () => {
  it("matches first last variants", () => {
    expect(namesMatch("Jeff Russell", "Russell, Jeff")).toBe(true);
  });
});
