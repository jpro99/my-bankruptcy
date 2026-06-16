import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CaliforniaDistrictSchema, listCaliforniaDistricts, getCourtReadiness } from "@chapterai/districts";
import type { AppEnv } from "../index.js";
import {
  assembleDemoPetition,
  exportDemoProvenance,
  getDemoCourtReadiness,
  getDemoDistrictInfo,
  getDemoProvenanceEvents,
  isDemoMatter,
  setDemoDistrict,
  updateDemoScheduleItem,
  addDemoAsset,
  addDemoScheduleLine,
  addDemoCodebtor,
  removeDemoScheduleItem,
  approveDemoScheduleForm,
} from "../lib/demo-store.js";

export const schedulesRouter = new Hono<AppEnv>();

schedulesRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  const petition = assembleDemoPetition(matterId);
  const district = getDemoDistrictInfo(matterId);
  return c.json({ petition, district });
});

export const districtsRouter = new Hono<AppEnv>();

districtsRouter.get("/", (c) => {
  return c.json({ districts: listCaliforniaDistricts() });
});

districtsRouter.get("/readiness", (c) => {
  const county = c.req.query("county") ?? "Riverside";
  const chapter = c.req.query("chapter") === "13" ? "13" : "7";
  const efileMode = process.env.EFILE_MODE === "live" ? "live" : "sandbox";
  return c.json({ readiness: getCourtReadiness({ county, chapter, efileMode }) });
});

districtsRouter.get("/matter/:matterId/readiness", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  return c.json(getDemoCourtReadiness(matterId));
});

districtsRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  return c.json({ district: getDemoDistrictInfo(matterId) });
});

const SetDistrictSchema = z.object({
  district: CaliforniaDistrictSchema.optional(),
  county: z.string().min(1).optional(),
});

districtsRouter.patch(
  "/matter/:matterId",
  zValidator("json", SetDistrictSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    const district = setDemoDistrict(matterId, body);
    const petition = assembleDemoPetition(matterId);
    return c.json({ district, petition });
  }
);

const ScheduleItemSchema = z.object({
  value: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
}).refine((body) => body.value !== undefined || body.label || body.description, {
  message: "Provide value, label, or description",
});

schedulesRouter.patch(
  "/matter/:matterId/items/:itemId",
  zValidator("json", ScheduleItemSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    const itemId = c.req.param("itemId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    try {
      const petition = updateDemoScheduleItem(matterId, itemId, body);
      const district = getDemoDistrictInfo(matterId);
      return c.json({ petition, district, itemId, ...body });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : "Update failed" }, 400);
    }
  }
);

const AddAssetSchema = z.object({
  description: z.string().min(1),
  category: z.string().min(1),
  currentValue: z.string().min(1),
  securedAmount: z.string().optional(),
  exemptionSystem: z.string().optional(),
  exemptionAmount: z.string().optional(),
});

schedulesRouter.post(
  "/matter/:matterId/assets",
  zValidator("json", AddAssetSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    const petition = addDemoAsset(matterId, body);
    const district = getDemoDistrictInfo(matterId);
    return c.json({ petition, district }, 201);
  }
);

const AddScheduleLineSchema = z.object({
  formId: z.enum(["106I", "106J", "107"]),
  lineLabel: z.string().min(1),
  amount: z.string().min(1),
});

const AddCodebtorSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().optional(),
  creditorOrDebt: z.string().optional(),
});

const ApproveFormSchema = z.object({
  formId: z.enum(["106I", "106J", "106H", "107"]),
});

schedulesRouter.post(
  "/matter/:matterId/codebtors",
  zValidator("json", AddCodebtorSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    const petition = addDemoCodebtor(matterId, body);
    const district = getDemoDistrictInfo(matterId);
    return c.json({ petition, district }, 201);
  }
);

schedulesRouter.post(
  "/matter/:matterId/lines",
  zValidator("json", AddScheduleLineSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    const petition = addDemoScheduleLine(matterId, body);
    const district = getDemoDistrictInfo(matterId);
    return c.json({ petition, district }, 201);
  }
);

schedulesRouter.post(
  "/matter/:matterId/approve-form",
  zValidator("json", ApproveFormSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) {
      return c.json({ error: "Matter not found" }, 404);
    }
    const body = c.req.valid("json");
    const petition = approveDemoScheduleForm(matterId, body.formId);
    const district = getDemoDistrictInfo(matterId);
    return c.json({ petition, district, formId: body.formId });
  }
);

schedulesRouter.delete("/matter/:matterId/items/:itemId", async (c) => {
  const matterId = c.req.param("matterId");
  const itemId = c.req.param("itemId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  try {
    const petition = removeDemoScheduleItem(matterId, itemId);
    const district = getDemoDistrictInfo(matterId);
    return c.json({ petition, district, itemId });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Remove failed" }, 400);
  }
});

export const provenanceRouter = new Hono<AppEnv>();

provenanceRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  const events = getDemoProvenanceEvents(matterId);
  return c.json({
    matterId,
    eventCount: events.length,
    events: events.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });
});

provenanceRouter.get("/matter/:matterId/export", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }
  const bundle = exportDemoProvenance(matterId);
  return c.json(bundle);
});
