import { Hono } from "hono";
import type { AppEnv } from "../index.js";
import { getFilingPackagePreview, isDemoMatter } from "../lib/demo-store.js";

export const filingRouter = new Hono<AppEnv>();

filingRouter.get("/matter/:matterId/package", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ package: getFilingPackagePreview(matterId) });
});
