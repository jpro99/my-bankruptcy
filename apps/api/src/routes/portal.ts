import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  completeCounselingCourse,
  getDemoPortal,
  getSecurePortalUrl,
  getDemoFirmId,
  isDemoPortalToken,
  markPortalRequestUploaded,
  portalTokenForMatter,
  recordPortalGeneralUploadActivity,
  recordPortalRequestUploadActivity,
  resolvePortalMatterId,
  submitPortalUpload,
  submitPortalGeneralUpload,
  completePortalRequest,
  addPortalClientMessage,
} from "../lib/demo-store.js";
import { processIntakeFileUpload, readUploadFormFile } from "../lib/intake-upload.js";

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

portalRouter.post("/:token/upload/file", async (c) => {
  const token = c.req.param("token");
  if (!isDemoPortalToken(token)) {
    return c.json({ error: "Invalid portal link" }, 404);
  }
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return c.json({ error: "Invalid portal link" }, 404);

  let formFile;
  try {
    formFile = await readUploadFormFile(c);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid upload";
    const status = message.includes("too large") ? 413 : 400;
    return c.json({ error: message }, status);
  }
  if (!formFile.requestId) {
    return c.json({ error: "Missing requestId" }, 400);
  }

  const portal = getDemoPortal(token);
  const req = portal.requests.find((r) => r.id === formFile.requestId);
  if (!req) return c.json({ error: "Request not found" }, 404);

  try {
    const result = await processIntakeFileUpload({
      matterId,
      firmId: getDemoFirmId(),
      fileName: formFile.fileName,
      documentType: formFile.documentType ?? inferPortalDocType(formFile.fileName, req.title),
      mimeType: formFile.mimeType,
      body: formFile.body,
      uploadedBy: "client",
      source: "portal",
      requestId: formFile.requestId,
    });
    if (!result.ok) {
      return c.json({ error: "Upload blocked", preview: result.preview }, 409);
    }
    const request = markPortalRequestUploaded(token, formFile.requestId, formFile.fileName);
    if (request) {
      recordPortalRequestUploadActivity(matterId, request.title, formFile.fileName);
    }
    console.info(
      `[portal] document uploaded matterId=${matterId} documentId=${result.document.id} stored=${result.document.stored === true}`
    );
    return c.json({ success: true, request, document: result.document });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return c.json({ error: message }, 400);
  }
});

portalRouter.post("/:token/upload-general/file", async (c) => {
  const token = c.req.param("token");
  if (!isDemoPortalToken(token)) {
    return c.json({ error: "Invalid portal link" }, 404);
  }
  const matterId = resolvePortalMatterId(token);
  if (!matterId) return c.json({ error: "Invalid portal link" }, 404);

  let formFile;
  try {
    formFile = await readUploadFormFile(c);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid upload";
    const status = message.includes("too large") ? 413 : 400;
    return c.json({ error: message }, status);
  }

  try {
    const result = await processIntakeFileUpload({
      matterId,
      firmId: getDemoFirmId(),
      fileName: formFile.fileName,
      documentType: formFile.documentType,
      mimeType: formFile.mimeType,
      body: formFile.body,
      uploadedBy: "client",
      source: "portal_general",
    });
    if (!result.ok) {
      return c.json({ error: "Upload blocked", preview: result.preview }, 409);
    }
    recordPortalGeneralUploadActivity(matterId, formFile.fileName);
    console.info(
      `[portal] general upload matterId=${matterId} documentId=${result.document.id} stored=${result.document.stored === true}`
    );
    return c.json({ success: true, document: result.document });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return c.json({ error: message }, 400);
  }
});

function inferPortalDocType(fileName: string, title: string): string {
  const hay = `${fileName} ${title}`.toLowerCase();
  if (hay.includes("license") || hay.includes(" id")) return "drivers_license";
  if (hay.includes("pay")) return "paystub";
  if (hay.includes("bank")) return "bank_statement";
  if (hay.includes("tax") || hay.includes("1040")) return "tax_return";
  return "other";
}

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
