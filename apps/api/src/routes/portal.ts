import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getDemoPortal,
  isDemoPortalToken,
  submitPortalUpload,
  completePortalRequest,
} from "../lib/demo-store.js";

/** Public client portal — magic link, no attorney auth */
export const portalRouter = new Hono();

portalRouter.get("/:token", async (c) => {
  const token = c.req.param("token");
  if (!isDemoPortalToken(token)) {
    return c.json({ error: "Invalid portal link" }, 404);
  }

  const portal = getDemoPortal(token);
  return c.json({ portal });
});

const UploadSchema = z.object({
  requestId: z.string(),
  fileName: z.string(),
  documentType: z.string().optional(),
});

portalRouter.post("/:token/upload", zValidator("json", UploadSchema), async (c) => {
  const token = c.req.param("token");
  if (!isDemoPortalToken(token)) {
    return c.json({ error: "Invalid portal link" }, 404);
  }

  const body = c.req.valid("json");
  const result = submitPortalUpload(token, body.requestId, body.fileName);
  if (!result) return c.json({ error: "Request not found" }, 404);
  return c.json({ success: true, request: result });
});

portalRouter.post("/:token/complete/:requestId", async (c) => {
  const token = c.req.param("token");
  const requestId = c.req.param("requestId");
  if (!isDemoPortalToken(token)) {
    return c.json({ error: "Invalid portal link" }, 404);
  }

  const result = completePortalRequest(token, requestId);
  if (!result) return c.json({ error: "Request not found" }, 404);
  return c.json({ success: true, portal: getDemoPortal(token) });
});
