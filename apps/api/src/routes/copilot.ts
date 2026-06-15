import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { computeMatterProgress } from "@chapterai/matter-guide";
import { runPreflight } from "@chapterai/preflight";
import { runDistrictPreflight } from "@chapterai/districts";
import type { AppEnv } from "../index.js";
import { runCopilot, type CopilotPhase } from "../lib/copilot-engine.js";
import {
  assembleDemoPetition,
  getDemoDiagnostics,
  getDemoDistrictInfo,
  getDemoFiling,
  getDemoMatterMeta,
  getDemoPortal,
  getDemoReviewFields,
  getIntakeDossier,
  isDemoMatter,
  portalTokenForMatter,
} from "../lib/demo-store.js";

export const copilotRouter = new Hono<AppEnv>();

const AskSchema = z.object({
  question: z.string().min(1).max(2000),
  phase: z.enum(["scout", "forge", "gavel", "continuum"]),
});

function buildProgress(matterId: string) {
  const meta = getDemoMatterMeta(matterId);
  const districtInfo = getDemoDistrictInfo(matterId);
  const fields = getDemoReviewFields(matterId);
  const pending = fields.filter((f) => f.approvalState === "pending").length;
  const diagnostics = getDemoDiagnostics(matterId);
  const filing = getDemoFiling(matterId);
  const petition = assembleDemoPetition(matterId);
  const portal = getDemoPortal(portalTokenForMatter(matterId));
  const counselingComplete = portal.counseling.course1.status === "complete";
  const dossier = getIntakeDossier(matterId);
  const localFormsComplete = pending === 0;

  const districtPreflight = runDistrictPreflight({
    district: districtInfo.district,
    divisionId: districtInfo.divisionId,
    county: districtInfo.county,
    chapter: meta.chapter,
    localFormsComplete,
    hasCertificateOfCreditCounseling: counselingComplete,
    hasRara: localFormsComplete,
  });

  const report = runPreflight({
    matterId,
    chapter: meta.chapter,
    district: districtInfo.district,
    hasDebtor1: true,
    hasIncomeSchedule: true,
    hasExpenseSchedule: true,
    pendingFieldCount: pending,
    presumptionOfAbuse: diagnostics.presumptionOfAbuse,
    exemptionGaps: diagnostics.exemptionGaps,
    creditPulled: !!diagnostics.creditSummary,
    planFeasible: true,
    bestInterestPassed: true,
    localFormsComplete,
  });

  const preflightReady = report.readyToFile && districtPreflight.errors === 0;

  const progress = computeMatterProgress({
    matterId,
    chapter: meta.chapter,
    debtorDisplayName: meta.debtorDisplayName,
    intakeComplete: fields.length > 0,
    reviewComplete: pending === 0 && fields.length > 0,
    pendingFieldCount: pending,
    creditPulled: !!diagnostics.creditSummary,
    preflightReady,
    filed: !!filing,
    autopilotActive: !!filing,
    clientPortalRequestsOpen: 0,
    balanceDue: "0",
    petitionCompletionPercent: petition.overallCompletion,
    districtConfigured: true,
    counselingComplete,
    consultComplete: !!dossier.consult?.evaluatedAt,
    pendingIntakeCount: dossier.pendingApplyCount,
  });

  return { meta, progress, preflightReady, filed: !!filing, pending };
}

/** Relief Co-pilot — matter-scoped, PII-redacted Q&A */
copilotRouter.post(
  "/matter/:matterId",
  zValidator("json", AskSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }

    const body = c.req.valid("json");
    const { meta, progress, preflightReady, filed, pending } = buildProgress(matterId);
    const phase = body.phase as CopilotPhase;

    const result = runCopilot(body.question, {
      matterId,
      phase,
      chapter: meta.chapter,
      debtorLabel: "Client",
      nextActionLabel: progress.nextAction?.label,
      nextActionHref: progress.nextAction?.href,
      filed,
      pendingFieldCount: pending,
      overallPercent: progress.overallPercent,
      preflightReady,
    });

    return c.json(result);
  }
);
