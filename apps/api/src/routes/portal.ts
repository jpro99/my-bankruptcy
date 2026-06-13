import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  completeCounselingCourse,
  getDemoPortal,
  getSecurePortalUrl,
  isDemoPortalToken,
  portalTokenForMatter,
  submitPortalUpload,
  submitPortalGeneralUpload,
  completePortalRequest,
  addPortalClientMessage,
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
  const result = submitPortalUpload(token, body.requestId, body.fileName, body.documentType);
  if (!result) return c.json({ error: "Request not found" }, 404);
  return c.json({ success: true, request: result });
});

const GeneralUploadSchema = z.object({
  fileName: z.string().min(1),
  documentType: z.string().optional(),
});

portalRouter.post(
  "/:token/upload-general",
  zValidator("json", GeneralUploadSchema),
  async (c) => {
    const token = c.req.param("token");
    if (!isDemoPortalToken(token)) {
      return c.json({ error: "Invalid portal link" }, 404);
    }
    const body = c.req.valid("json");
    const document = submitPortalGeneralUpload(token, body.fileName, body.documentType);
    if (!document) return c.json({ error: "Upload failed" }, 400);
    return c.json({ success: true, document });
  }
);

portalRouter.post("/:token/complete/:requestId", async (c) => {
  const token = c.req.param("token");
  const requestId = c.req.param("requestId");
  if (!isDemoPortalToken(token)) {
    return c.json({ error: "Invalid or expired portal link" }, 404);
  }

  const result = completePortalRequest(token, requestId);
  if (!result) return c.json({ error: "Request not found" }, 404);
  return c.json({ success: true, portal: getDemoPortal(token) });
});

const CounselingCompleteSchema = z.object({
  course: z.union([z.literal(1), z.literal(2)]),
  certificateFileName: z.string().optional(),
  certificateNumber: z.string().optional(),
  simulateGold: z.boolean().optional(),
});

portalRouter.post(
  "/:token/messages",
  zValidator("json", z.object({ body: z.string().min(1) })),
  async (c) => {
    const token = c.req.param("token");
    if (!isDemoPortalToken(token)) {
      return c.json({ error: "Invalid portal link" }, 404);
    }
    const { body } = c.req.valid("json");
    const message = addPortalClientMessage(token, body);
    if (!message) return c.json({ error: "Failed" }, 400);
    return c.json({ success: true, message }, 201);
  }
);

portalRouter.post(
  "/:token/counseling/complete",
  zValidator("json", CounselingCompleteSchema),
  async (c) => {
    const token = c.req.param("token");
    if (!isDemoPortalToken(token)) {
      return c.json({ error: "Invalid or expired portal link" }, 404);
    }
    const body = c.req.valid("json");
    const portal = completeCounselingCourse(token, body.course, body);
    if (!portal) return c.json({ error: "Course not available" }, 400);
    return c.json({ success: true, portal });
  }
);
