import { Hono } from "hono";
import type { AppEnv } from "../index.js";
import { getCourtPacketPreview, getFilingPackagePreview, isDemoMatter } from "../lib/demo-store.js";

export const filingRouter = new Hono<AppEnv>();

filingRouter.get("/matter/:matterId/package", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ package: getFilingPackagePreview(matterId) });
});

filingRouter.get("/matter/:matterId/court-preview", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  const practice = c.req.query("practice") === "1";
  return c.json({ preview: getCourtPacketPreview(matterId, { practice }) });
});
