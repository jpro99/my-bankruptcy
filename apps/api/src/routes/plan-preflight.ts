import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { evaluatePlanFeasibility } from "@chapterai/ch13-plan";
import { runPreflight } from "@chapterai/preflight";
import type { AppEnv } from "../index.js";
import { getDemoDiagnostics, getDemoReviewFields, isDemoMatter } from "../lib/demo-store.js";

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

  const report = runPreflight({
    matterId,
    chapter: diagnostics.chapterRecommendation === "13" ? "13" : "7",
    district: "CACB",
    hasDebtor1: true,
    hasIncomeSchedule: true,
    hasExpenseSchedule: true,
    pendingFieldCount: pending,
    presumptionOfAbuse: diagnostics.presumptionOfAbuse,
    exemptionGaps: diagnostics.exemptionGaps,
    creditPulled,
    planFeasible: true,
    bestInterestPassed: true,
    localFormsComplete: pending === 0,
  });

  return c.json({ report });
});

preflightRouter.post("/matter/:matterId/file", async (c) => {
  const matterId = c.req.param("matterId");

  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const diagnostics = getDemoDiagnostics(matterId);
  const fields = getDemoReviewFields(matterId);
  const pending = fields.filter((f) => f.approvalState === "pending").length;

  const report = runPreflight({
    matterId,
    chapter: diagnostics.chapterRecommendation === "13" ? "13" : "7",
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

  if (!report.readyToFile) {
    return c.json({ error: "Preflight failed", report }, 400);
  }

  return c.json({
    status: "filed",
    caseNumber: "2:26-bk-04821",
    message: "Petition package submitted to CACB CM/ECF (sandbox)",
    receiptUrl: "/receipts/demo-filing.pdf",
  });
});
