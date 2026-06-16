import { describe, expect, it } from "vitest";
import { getCourtReadiness, getRequiredCourtForms } from "../court-readiness.js";

describe("Court readiness — Riverside / CACB", () => {
  it("lists full Ch 7 CACB packet including local forms", () => {
    const forms = getRequiredCourtForms("CACB", "7");
    const ids = forms.map((f) => f.formId);
    expect(ids).toContain("101");
    expect(ids).toContain("3015-1.7");
    expect(ids).toContain("MML");
    expect(ids).toContain("341");
    expect(ids).toHaveLength(16);
  });

  it("adds Ch 13 plan for CACB Ch 13", () => {
    const forms = getRequiredCourtForms("CACB", "13");
    expect(forms.map((f) => f.formId)).toContain("3015-1.01");
    expect(forms).toHaveLength(17);
  });

  it("Riverside County routes to Riverside division with Inland Empire counties", () => {
    const readiness = getCourtReadiness({ county: "Riverside", chapter: "7" });
    expect(readiness.district).toBe("CACB");
    expect(readiness.division.id).toBe("riverside");
    expect(readiness.division.courthouse).toContain("Riverside");
    expect(readiness.surroundingCounties).toEqual(["Riverside", "San Bernardino"]);
    expect(readiness.connections.practiceReady).toBe(true);
    expect(readiness.cmEcfBaseUrl).toBe("https://ecf.cacb.uscourts.gov");
  });

  it("San Bernardino shares Riverside division readiness", () => {
    const readiness = getCourtReadiness({ county: "San Bernardino", chapter: "7" });
    expect(readiness.division.id).toBe("riverside");
    expect(readiness.connections.countyRouting).toBe(true);
  });
});
