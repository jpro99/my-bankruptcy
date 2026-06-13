import { Hono } from "hono";
import { computeMatterProgress } from "@chapterai/matter-guide";
import { runPreflight } from "@chapterai/preflight";
import type { AppEnv } from "../index.js";
import {
  getDemoAutopilot,
  getDemoBilling,
  getDemoDiagnostics,
  getDemoFiling,
  getDemoMatterMeta,
  getDemoPortalOpenCount,
  getDemoReviewFields,
  isDemoMatter,
} from "../lib/demo-store.js";

export const commandRouter = new Hono<AppEnv>();

/** Attorney Command Center — one-screen Ch 7/13 completion progress */
commandRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const meta = getDemoMatterMeta(matterId);
  const fields = getDemoReviewFields(matterId);
  const pending = fields.filter((f) => f.approvalState === "pending").length;
  const diagnostics = getDemoDiagnostics(matterId);
  const filing = getDemoFiling(matterId);
  const autopilot = getDemoAutopilot(matterId);
  const billing = getDemoBilling(matterId);

  const preflight = runPreflight({
    matterId,
    chapter: meta.chapter,
    district: "CACB",
    hasDebtor1: true,
    hasIncomeSchedule: true,
    hasExpenseSchedule: true,
    pendingFieldCount: pending,
    presumptionOfAbuse: diagnostics.presumptionOfAbuse,
    exemptionGaps: diagnostics.exemptionGaps,
    creditPulled: !!diagnostics.creditSummary,
    planFeasible: true,
    bestInterestPassed: true,
    localFormsComplete: pending === 0,
  });

  const progress = computeMatterProgress({
    matterId,
    chapter: meta.chapter,
    debtorDisplayName: meta.debtorDisplayName,
    intakeComplete: fields.length > 0,
    reviewComplete: pending === 0 && fields.length > 0,
    pendingFieldCount: pending,
    creditPulled: !!diagnostics.creditSummary,
    preflightReady: preflight.readyToFile,
    filed: !!filing,
    autopilotActive: !!autopilot,
    clientPortalRequestsOpen: getDemoPortalOpenCount(matterId),
    balanceDue: billing?.balanceDue ?? "2908.00",
  });

  return c.json({
    progress,
    preflightReady: preflight.readyToFile,
    caseNumber: filing?.caseNumber,
    portalUrl: `/portal/${matterId}-client`,
  });
});
