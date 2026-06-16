import type { Context } from "hono";
import {
  addIntakeDocument,
  addMatterNote,
  isDemoMatter,
  previewIntakeUpload,
  type IntakeDocument,
} from "./demo-store.js";
import { persistMatterDocument } from "./document-storage.js";

export const MAX_INTAKE_FILE_BYTES = 25 * 1024 * 1024;

export interface IntakeUploadOptions {
  matterId: string;
  fileName: string;
  documentType?: string;
  mimeType?: string;
  uploadedBy: "client" | "attorney";
  source: IntakeDocument["source"];
  requestId?: string;
  confirmMismatch?: boolean;
  targetMatterId?: string;
  body: Buffer;
  firmId: string;
}

export type IntakeUploadResponse =
  | {
      ok: true;
      document: IntakeDocument;
      savedToMatterId: string;
      preview: ReturnType<typeof previewIntakeUpload>;
    }
  | { ok: false; status: 409; preview: ReturnType<typeof previewIntakeUpload> };

export async function processIntakeFileUpload(
  options: IntakeUploadOptions
): Promise<IntakeUploadResponse> {
  const preview = previewIntakeUpload(
    options.matterId,
    options.fileName,
    options.documentType
  );

  if (preview.action === "confirm" && !options.confirmMismatch && !options.targetMatterId) {
    return { ok: false, status: 409, preview };
  }

  let finalMatterId = options.matterId;
  if (options.targetMatterId && isDemoMatter(options.targetMatterId)) {
    finalMatterId = options.targetMatterId;
  }

  const documentId = `doc-${crypto.randomUUID().slice(0, 8)}`;
  const mimeType =
    options.mimeType?.split(";")[0]?.trim() || "application/octet-stream";

  const stored = await persistMatterDocument({
    firmId: options.firmId,
    matterId: finalMatterId,
    documentId,
    fileName: options.fileName,
    mimeType,
    body: options.body,
  });

  const document = addIntakeDocument(finalMatterId, {
    id: documentId,
    fileName: options.fileName,
    documentType: options.documentType,
    uploadedBy: options.uploadedBy,
    source: options.source,
    requestId: options.requestId,
    mimeType,
    storageKey: stored.storageKey || undefined,
    sha256: stored.sha256,
    sizeBytes: stored.sizeBytes,
    stored: stored.stored,
  });

  if (finalMatterId !== options.matterId) {
    addMatterNote(finalMatterId, {
      text: `Document filed here (identity match): ${options.fileName}`,
      source: "system",
      authorLabel: "Smart match",
    });
    addMatterNote(options.matterId, {
      text: `Upload redirected — ${options.fileName} matched ${preview.bestMatch?.debtorDisplayName ?? finalMatterId}'s file`,
      source: "system",
      authorLabel: "Smart match",
    });
  }

  return { ok: true, document, savedToMatterId: finalMatterId, preview };
}

export async function readUploadFormFile(c: {
  req: { formData: () => Promise<FormData> };
}): Promise<{
  fileName: string;
  mimeType: string;
  body: Buffer;
  documentType?: string;
  confirmMismatch?: boolean;
  targetMatterId?: string;
  requestId?: string;
}> {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    throw new Error("Missing file");
  }

  const body = Buffer.from(await (file as Blob).arrayBuffer());
  if (body.length === 0) {
    throw new Error("Empty file");
  }
  if (body.length > MAX_INTAKE_FILE_BYTES) {
    throw new Error(
      `File too large (max ${Math.round(MAX_INTAKE_FILE_BYTES / (1024 * 1024))} MB)`
    );
  }

  const fileName =
    (file as File).name?.trim() ||
    String(form.get("fileName") || "").trim() ||
    "document";

  const mimeType =
    (file as Blob).type ||
    String(form.get("mimeType") || "").trim() ||
    "application/octet-stream";

  const documentType = String(form.get("documentType") || "").trim() || undefined;
  const confirmMismatch = String(form.get("confirmMismatch") || "") === "true";
  const targetMatterId = String(form.get("targetMatterId") || "").trim() || undefined;
  const requestId = String(form.get("requestId") || "").trim() || undefined;

  return { fileName, mimeType, body, documentType, confirmMismatch, targetMatterId, requestId };
}
