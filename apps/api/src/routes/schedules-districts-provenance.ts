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
  value: z.string().min(1),
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
    const { value } = c.req.valid("json");
    const petition = updateDemoScheduleItem(matterId, itemId, value);
    const district = getDemoDistrictInfo(matterId);
    return c.json({ petition, district, itemId, value });
  }
);

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
