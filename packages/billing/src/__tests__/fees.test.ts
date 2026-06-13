import { describe, expect, it } from "vitest";
import { generateInvoice, recordPayment, getFeePackages } from "../fees.js";

describe("billing", () => {
  it("generates Ch 7 invoice with court and third-party fees", () => {
    const inv = generateInvoice({ matterId: "demo", chapter: "7" });
    expect(parseFloat(inv.subtotal)).toBeGreaterThan(2500);
    expect(inv.lines).toHaveLength(4);
    expect(inv.status).toBe("draft");
  });

  it("generates Ch 13 package", () => {
    const inv = generateInvoice({ matterId: "demo", chapter: "13", packageId: "ch13-standard" });
    expect(inv.packageId).toBe("ch13-standard");
  });

  it("records partial payment", () => {
    const inv = generateInvoice({ matterId: "demo", chapter: "7" });
    const updated = recordPayment(inv, "1000.00");
    expect(updated.status).toBe("partial");
    expect(parseFloat(updated.balanceDue)).toBeLessThan(parseFloat(inv.subtotal));
  });

  it("lists packages by chapter", () => {
    expect(getFeePackages("7")).toHaveLength(2);
    expect(getFeePackages("13")).toHaveLength(2);
  });
});
