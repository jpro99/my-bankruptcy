import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb, documents, matters } from "@chapterai/db";
import type { AppEnv } from "../index.js";

const UploadDocumentSchema = z.object({
  matterId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  documentType: z.enum([
    "drivers_license",
    "paystub",
    "bank_statement",
    "tax_return",
    "credit_report",
    "other",
  ]),
  storageKey: z.string().min(1),
  encryptionKeyId: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  sha256Hash: z.string().length(64),
});

export const documentsRouter = new Hono<AppEnv>();

documentsRouter.get("/matter/:matterId", async (c) => {
  const session = c.get("session");
  const matterId = c.req.param("matterId");
  const db = getDb();

  const docs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.matterId, matterId), eq(documents.firmId, session.firmId)));

  return c.json({ documents: docs });
});

documentsRouter.post("/", zValidator("json", UploadDocumentSchema), async (c) => {
  const session = c.get("session");
  const body = c.req.valid("json");
  const db = getDb();

  const [matter] = await db
    .select({ id: matters.id })
    .from(matters)
    .where(and(eq(matters.id, body.matterId), eq(matters.firmId, session.firmId)))
    .limit(1);

  if (!matter) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const [doc] = await db
    .insert(documents)
    .values({
      matterId: body.matterId,
      firmId: session.firmId,
      uploadedByUserId: session.userId,
      documentType: body.documentType,
      fileName: body.fileName,
      mimeType: body.mimeType,
      storageKey: body.storageKey,
      encryptionKeyId: body.encryptionKeyId,
      fileSizeBytes: body.fileSizeBytes,
      sha256Hash: body.sha256Hash,
    })
    .returning();

  return c.json({ document: doc }, 201);
});
