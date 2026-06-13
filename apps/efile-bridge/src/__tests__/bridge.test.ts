import { describe, expect, it } from "vitest";
import { buildFilingPackage } from "@chapterai/efile";
import { getBridgeStatus, submitViaBridge } from "../index.js";

describe("efile-bridge", () => {
  it("reports sandbox status by default", async () => {
    const status = await getBridgeStatus();
    expect(status.mode).toBe("sandbox");
  });

  it("submits filing in sandbox mode", async () => {
    const pkg = buildFilingPackage({
      matterId: "demo",
      firmId: "firm-1",
      district: "CACB",
      chapter: "7",
      debtorDisplayName: "Test Debtor",
      attorneyName: "Test Attorney",
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
      ],
    });

    const result = await submitViaBridge(pkg, { mode: "sandbox" });
    expect(result.status).toBe("filed");
    expect(result.mode).toBe("sandbox");
  });
});
