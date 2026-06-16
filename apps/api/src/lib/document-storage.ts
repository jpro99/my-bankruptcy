import { createHash } from "node:crypto";
import { getR2Object, isR2Configured, putR2Object } from "./r2-storage.js";

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export function sha256Hex(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

export function sanitizeStorageFileName(fileName: string): string {
  const base = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
  return base.length > 0 ? base : "document";
}

export function buildDocumentStorageKey(
  firmId: string,
  matterId: string,
  documentId: string,
  fileName: string
): string {
  return `firms/${firmId}/matters/${matterId}/documents/${documentId}/${sanitizeStorageFileName(fileName)}`;
}

export function assertDocumentSize(body: Buffer): void {
  if (body.length === 0) {
    throw new Error("Empty file");
  }
  if (body.length > MAX_DOCUMENT_BYTES) {
    throw new Error(`File too large (max ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB)`);
  }
}

export interface PersistDocumentResult {
  storageKey: string;
  sha256: string;
  sizeBytes: number;
  stored: boolean;
  encryptionKeyId: string;
}

/** Store matter document bytes in R2 when configured; always return hash + size. */
export async function persistMatterDocument(input: {
  firmId: string;
  matterId: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  body: Buffer;
}): Promise<PersistDocumentResult> {
  assertDocumentSize(input.body);
  const sha256 = sha256Hex(input.body);
  const sizeBytes = input.body.length;

  if (!isR2Configured()) {
    return {
      storageKey: "",
      sha256,
      sizeBytes,
      stored: false,
      encryptionKeyId: "none",
    };
  }

  const storageKey = buildDocumentStorageKey(
    input.firmId,
    input.matterId,
    input.documentId,
    input.fileName
  );
  await putR2Object(storageKey, input.body, input.mimeType);

  return {
    storageKey,
    sha256,
    sizeBytes,
    stored: true,
    encryptionKeyId: "r2-default",
  };
}

export async function readMatterDocument(storageKey: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  if (!isR2Configured() || !storageKey) {
    throw new Error("Document file not available");
  }
  return getR2Object(storageKey);
}

export function documentStorageStatus(): { status: string; note: string } {
  if (isR2Configured()) {
    return {
      status: "configured",
      note: "Client and attorney uploads stored in Cloudflare R2",
    };
  }
  return {
    status: "metadata_only",
    note: "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME for live file storage",
  };
}
