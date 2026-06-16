import { Hono } from "hono";
import { buildFilingPackage, validatePackageForFiling } from "@chapterai/efile";
import { submitViaBridge } from "@chapterai/efile-bridge";
import type { AppEnv } from "../index.js";
import {
  getApprovedFormIds,
  getDemoFiling,
  getDemoMatterMeta,
  isAttorneySignOffComplete,
  isDemoMatter,
  setDemoFiling,
  setDemoAutopilot,
} from "../lib/demo-store.js";
import { FIRM_ATTORNEY_NAME } from "../lib/firm-brand.js";
import { generateTimeline } from "@chapterai/autopilot";

export const efileRouter = new Hono<AppEnv>();

efileRouter.get("/status", async (c) => {
  const { getBridgeStatus } = await import("@chapterai/efile-bridge");
  const bridge = await getBridgeStatus();
  return c.json({ bridge, version: "0.4.0" });
});

efileRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const filing = getDemoFiling(matterId);
  const meta = getDemoMatterMeta(matterId);
  const approvedFormIds = getApprovedFormIds(matterId);

  let packagePreview = null;
  if (approvedFormIds.length > 0) {
    try {
      const pkg = buildFilingPackage({
        ...meta,
        attorneyName: FIRM_ATTORNEY_NAME,
        approvedFormIds,
        district: "CACB",
      });
      packagePreview = {
        documentCount: pkg.documents.length,
        documents: pkg.documents.map((d) => ({
          formId: d.formId,
          label: d.label,
          eventCode: d.eventCode,
        })),
        validation: validatePackageForFiling(pkg),
      };
    } catch {
      packagePreview = null;
    }
  }

  return c.json({
    matterId,
    filed: !!filing,
    filing: filing ?? null,
    packagePreview,
  });
});

efileRouter.post("/matter/:matterId/submit", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const existing = getDemoFiling(matterId);
  if (existing) {
    return c.json({ error: "Matter already filed", filing: existing }, 409);
  }

  if (!isAttorneySignOffComplete(matterId)) {
    return c.json(
      {
        error: "Attorney final sign-off required",
        message:
          "Complete Final Check — staff document QA, numbers review, and attorney sign-off before filing the petition.",
      },
      403
    );
  }

  const meta = getDemoMatterMeta(matterId);
  const approvedFormIds = getApprovedFormIds(matterId);

  const pkg = buildFilingPackage({
    ...meta,
    attorneyName: FIRM_ATTORNEY_NAME,
    approvedFormIds,
    district: "CACB",
  });

  const validation = validatePackageForFiling(pkg);
  if (!validation.valid) {
    return c.json({ error: "Invalid filing package", validation }, 400);
  }

  const result = await submitViaBridge(pkg);
  setDemoFiling(matterId, result);

  const filingDate = result.filedAt.slice(0, 10);
  const timeline = generateTimeline({
    matterId,
    caseNumber: result.caseNumber,
    chapter: meta.chapter,
    filingDate,
  });
  setDemoAutopilot(matterId, timeline);

  return c.json({ result, autopilot: timeline });
});

efileRouter.get("/receipt/:jobId", (c) => {
  const jobId = c.req.param("jobId");
  const html = `<!DOCTYPE html>
<html><head><title>CM/ECF Filing Receipt</title></head>
<body style="font-family: system-ui; padding: 2rem;">
<h1>ChapterAI — E-File Receipt (Sandbox)</h1>
<p><strong>Receipt ID:</strong> ${jobId}</p>
<p>This is a sandbox filing receipt. In production, this PDF is generated from CM/ECF confirmation.</p>
</body></html>`;
  return c.html(html);
});
