import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../index.js";
import {
  isDemoMatter,
  runDemoCreditPull,
  getDemoTradelines,
  getDemoDiagnostics,
  getTradelineReview,
  patchDemoTradeline,
  addManualCreditor,
  assembleDemoPetition,
  recomputeDemoDiagnostics,
} from "../lib/demo-store.js";

const CreditPullSchema = z.object({
  debtorFirstName: z.string().min(1).default("Maria"),
  debtorLastName: z.string().min(1).default("Martinez"),
  ssnLast4: z.string().regex(/^\d{4}$/).default("1234"),
  consentTimestamp: z.string().datetime().optional(),
});

export const creditRouter = new Hono<AppEnv>();

creditRouter.post(
  "/matter/:matterId/pull",
  zValidator("json", CreditPullSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    const body = c.req.valid("json");

    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Credit pull requires demo matter or DATABASE_URL" }, 501);
    }

    const result = await runDemoCreditPull(matterId);
    const diagnostics = getDemoDiagnostics(matterId);

    return c.json({
      matterId,
      pullId: crypto.randomUUID(),
      provider: process.env.CRS_CREDIT_API_KEY ? "crs" : "sandbox",
      tradelineCount: result.classified.length,
      summary: result.summary,
      diagnostics,
      debtor: body,
    });
  }
);

creditRouter.get("/matter/:matterId/tradelines", async (c) => {
  const matterId = c.req.param("matterId");

  if (!isDemoMatter(matterId)) {
    return c.json({ tradelines: [] });
  }

  const tradelines = getDemoTradelines(matterId);
  return c.json({ tradelines, total: tradelines.length });
});

const TradelineIncludeSchema = z.object({
  included: z.boolean().optional(),
  schedule: z.enum(["D", "E", "F", "G"]).optional(),
  isDuplicate: z.boolean().optional(),
  duplicateOfId: z.string().nullable().optional(),
  creditorName: z.string().min(1).optional(),
  balance: z.string().optional(),
  monthlyPayment: z.string().optional(),
});

const AddManualCreditorSchema = z.object({
  creditorName: z.string().min(1),
  balance: z.string().min(1),
  schedule: z.enum(["D", "E", "F", "G"]),
  accountType: z.string().optional(),
  monthlyPayment: z.string().optional(),
  collateralDescription: z.string().optional(),
});

creditRouter.get("/matter/:matterId/review", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  const entries = getTradelineReview(matterId);
  const includedCount = entries.filter((e) => e.included).length;
  return c.json({
    matterId,
    entries,
    total: entries.length,
    includedCount,
    excludedCount: entries.length - includedCount,
  });
});

creditRouter.patch(
  "/matter/:matterId/tradelines/:tradelineId",
  zValidator("json", TradelineIncludeSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    const tradelineId = c.req.param("tradelineId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const patch = c.req.valid("json");
    if (Object.keys(patch).length === 0) {
      return c.json({ error: "No updates provided" }, 400);
    }
    const before = getDemoTradelines(matterId);
    if (!before.some((t) => t.id === tradelineId)) {
      return c.json({ error: "Tradeline not found" }, 404);
    }
    patchDemoTradeline(matterId, tradelineId, patch);
    return c.json({
      matterId,
      tradelineId,
      ...patch,
      entries: getTradelineReview(matterId),
      diagnostics: getDemoDiagnostics(matterId),
      petition: assembleDemoPetition(matterId),
    });
  }
);

creditRouter.post(
  "/matter/:matterId/tradelines",
  zValidator("json", AddManualCreditorSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    const tradeline = addManualCreditor(matterId, body);
    return c.json({
      matterId,
      tradeline,
      entries: getTradelineReview(matterId),
      diagnostics: getDemoDiagnostics(matterId),
      petition: assembleDemoPetition(matterId),
    });
  }
);

creditRouter.get("/matter/:matterId/summary", async (c) => {
  const matterId = c.req.param("matterId");
  const tradelines = getDemoTradelines(matterId);

  const bySchedule = {
    D: tradelines.filter((t) => t.schedule === "D"),
    E: tradelines.filter((t) => t.schedule === "E"),
    F: tradelines.filter((t) => t.schedule === "F"),
    G: tradelines.filter((t) => t.schedule === "G"),
  };

  return c.json({ matterId, bySchedule, counts: {
    D: bySchedule.D.length,
    E: bySchedule.E.length,
    F: bySchedule.F.length,
    G: bySchedule.G.length,
  }});
});

export const diagnosticsRouter = new Hono<AppEnv>();

const RecomputeSchema = z.object({
  householdSize: z.number().int().positive().optional(),
  annualIncome: z.string().optional(),
  chapter: z.enum(["7", "13"]).optional(),
});

diagnosticsRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");

  if (isDemoMatter(matterId)) {
    return c.json({ diagnostics: getDemoDiagnostics(matterId) });
  }

  return c.json({ error: "Matter not found" }, 404);
});

diagnosticsRouter.post(
  "/matter/:matterId/recompute",
  zValidator("json", RecomputeSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    const body = c.req.valid("json");

    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }

    const diagnostics = recomputeDemoDiagnostics(matterId, body);
    return c.json({ diagnostics });
  }
);
