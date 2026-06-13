import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { evaluatePlanFeasibility } from "@chapterai/ch13-plan";
import { runPreflight } from "@chapterai/preflight";
import { buildFilingPackage } from "@chapterai/efile";
import { submitViaBridge } from "@chapterai/efile-bridge";
import { generateTimeline } from "@chapterai/autopilot";
import type { AppEnv } from "../index.js";
import {
  getApprovedFormIds,
  getDemoDiagnostics,
  getDemoDistrictInfo,
  getDemoFiling,
  getDemoMatterMeta,
  getDemoReviewFields,
  isAttorneySignOffComplete,
  isDemoMatter,
  setDemoAutopilot,
  setDemoFiling,
} from "../lib/demo-store.js";
import { runDistrictPreflight } from "@chapterai/districts";

const PlanCalcSchema = z.object({
  planLengthMonths: z.number().int().min(36).max(60).default(60),
  monthlyDisposableIncome: z.string().default("580.00"),
  chapter7Hypothetical: z.string().default("500.00"),
  generalUnsecuredTotal: z.string().default("7414.61"),
});

export const planRouter = new Hono<AppEnv>();

planRouter.post(
  "/matter/:matterId/calculate",
  zValidator("json", PlanCalcSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    const body = c.req.valid("json");

    const result = evaluatePlanFeasibility(
      {
        planLengthMonths: body.planLengthMonths,
        monthlyDisposableIncome: body.monthlyDisposableIncome,
        trusteeFeePercent: "10",
        securedClaims: [
          {
            id: "s1",
            creditorName: "Wells Fargo Mortgage",
            claimAmount: "312450.00",
            arrearage: "4200.00",
            monthlyContractPayment: "2185.00",
          },
          {
            id: "s2",
            creditorName: "Toyota Financial",
            claimAmount: "8420.00",
            arrearage: "570.00",
            monthlyContractPayment: "285.00",
          },
        ],
        priorityClaims: [
          { id: "p1", creditorName: "IRS", claimAmount: "3500.00", class: "taxes" },
        ],
        generalUnsecuredTotal: body.generalUnsecuredTotal,
      },
      {
        chapter7HypotheticalDistribution: body.chapter7Hypothetical,
        generalUnsecuredTotal: body.generalUnsecuredTotal,
      }
    );

    return c.json({ matterId, ...result });
  }
);

export const preflightRouter = new Hono<AppEnv>();

preflightRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");

  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const diagnostics = getDemoDiagnostics(matterId);
  const fields = getDemoReviewFields(matterId);
  const pending = fields.filter((f) => f.approvalState === "pending").length;
  const creditPulled = !!diagnostics.creditSummary;
  const districtInfo = getDemoDistrictInfo(matterId);
  const localFormsComplete = pending === 0;

  const report = runPreflight({
    matterId,
    chapter: diagnostics.chapterRecommendation === "13" ? "13" : "7",
    district: districtInfo.district,
    hasDebtor1: true,
    hasIncomeSchedule: true,
    hasExpenseSchedule: true,
    pendingFieldCount: pending,
    presumptionOfAbuse: diagnostics.presumptionOfAbuse,
    exemptionGaps: diagnostics.exemptionGaps,
    creditPulled,
    planFeasible: true,
    bestInterestPassed: true,
    localFormsComplete,
  });

  const districtReport = runDistrictPreflight({
    district: districtInfo.district,
    divisionId: districtInfo.divisionId,
    county: districtInfo.county,
    chapter: diagnostics.chapterRecommendation === "13" ? "13" : "7",
    localFormsComplete,
    hasCertificateOfCreditCounseling: localFormsComplete,
    hasRara: localFormsComplete,
  });

  return c.json({
    report: {
      ...report,
      readyToFile: report.readyToFile && districtReport.errors === 0,
      totalRules: report.totalRules + districtReport.results.length,
      passed: report.passed + districtReport.passed,
      errors: report.errors + districtReport.errors,
      warnings: report.warnings + districtReport.warnings,
      results: [
        ...report.results,
        ...districtReport.results.map((r) => ({
          ...r,
          passed: r.passed,
        })),
      ],
    },
    district: districtInfo,
    districtReport,
  });
});

preflightRouter.post("/matter/:matterId/file", async (c) => {
  const matterId = c.req.param("matterId");

  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const diagnostics = getDemoDiagnostics(matterId);
  const fields = getDemoReviewFields(matterId);
  const pending = fields.filter((f) => f.approvalState === "pending").length;
  const districtInfo = getDemoDistrictInfo(matterId);
  const localFormsComplete = pending === 0;

  const report = runPreflight({
    matterId,
    chapter: diagnostics.chapterRecommendation === "13" ? "13" : "7",
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

  const districtReport = runDistrictPreflight({
    district: districtInfo.district,
    divisionId: districtInfo.divisionId,
    county: districtInfo.county,
    chapter: diagnostics.chapterRecommendation === "13" ? "13" : "7",
    localFormsComplete,
    hasCertificateOfCreditCounseling: localFormsComplete,
    hasRara: localFormsComplete,
  });

  if (!report.readyToFile || districtReport.errors > 0) {
    return c.json({ error: "Preflight failed", report, districtReport }, 400);
  }

  if (!isAttorneySignOffComplete(matterId)) {
    return c.json(
      {
        error: "Attorney final sign-off required",
        message:
          "Complete Final Check on the matter — document QA, numbers review, and attorney thumbs-up.",
      },
      403
    );
  }

  const existing = getDemoFiling(matterId);
  if (existing) {
    return c.json({
      status: "filed",
      caseNumber: existing.caseNumber,
      message: "Petition already filed",
      receiptUrl: existing.receiptUrl,
      filing: existing,
    });
  }

  const meta = getDemoMatterMeta(matterId);
  const approvedFormIds = getApprovedFormIds(matterId);
  const pkg = buildFilingPackage({
    ...meta,
    attorneyName: "Dev Attorney",
    approvedFormIds,
    district: districtInfo.district,
  });

  const result = await submitViaBridge(pkg);
  setDemoFiling(matterId, result);

  const timeline = generateTimeline({
    matterId,
    caseNumber: result.caseNumber,
    chapter: meta.chapter,
    filingDate: result.filedAt.slice(0, 10),
  });
  setDemoAutopilot(matterId, timeline);

  return c.json({
    status: "filed",
    caseNumber: result.caseNumber,
    message: result.message,
    receiptUrl: result.receiptUrl,
    documentsFiled: result.documentsFiled,
    filing: result,
    autopilot: { taskCount: timeline.summary.total },
  });
});
