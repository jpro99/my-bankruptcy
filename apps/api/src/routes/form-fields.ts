import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import type { AppEnv } from "../index.js";
import {
  isDemoMatter,
  getDemoReviewFields,
  updateDemoFieldApproval,
} from "../lib/demo-store.js";

let dbModule: typeof import("@chapterai/db") | null = null;

async function getDbSafe() {
  if (!process.env.DATABASE_URL) return null;
  if (!dbModule) {
    dbModule = await import("@chapterai/db");
  }
  try {
    return dbModule.getDb();
  } catch {
    return null;
  }
}

const ApproveFieldSchema = z.object({
  approvedValue: z.unknown().optional(),
});

const BulkApproveSchema = z.object({
  matterId: z.string(),
  minConfidence: z.number().min(0).max(1).default(0.95),
});

export const formFieldsRouter = new Hono<AppEnv>();

formFieldsRouter.get("/matter/:matterId/review-queue", async (c) => {
  const session = c.get("session");
  const matterId = c.req.param("matterId");

  if (isDemoMatter(matterId)) {
    const fields = getDemoReviewFields(matterId);
    return c.json({
      fields: fields.map((f) => ({
        ...f,
        matterId,
        firmId: session.firmId,
      })),
      total: fields.length,
    });
  }

  const db = await getDbSafe();
  if (!db) {
    return c.json({ fields: [], total: 0 });
  }

  const { formFields } = await import("@chapterai/db");
  const fields = await db
    .select()
    .from(formFields)
    .where(
      and(
        eq(formFields.matterId, matterId),
        eq(formFields.firmId, session.firmId),
        eq(formFields.approvalState, "pending")
      )
    );

  return c.json({
    fields: fields.map((f) => ({
      ...f,
      confidence: f.confidence ? parseFloat(f.confidence) : null,
    })),
    total: fields.length,
  });
});

formFieldsRouter.post(
  "/:fieldId/approve",
  zValidator("json", ApproveFieldSchema),
  async (c) => {
    const session = c.get("session");
    const fieldId = c.req.param("fieldId");
    const body = c.req.valid("json");
    const matterId = c.req.header("x-matter-id") ?? "demo";

    if (isDemoMatter(matterId)) {
      const field = updateDemoFieldApproval(
        matterId,
        fieldId,
        "approved",
        body.approvedValue
      );
      if (!field) return c.json({ error: "Field not found" }, 404);
      return c.json({ field, provenance: { eventType: "attorney_approved" } });
    }

    const db = await getDbSafe();
    if (!db) return c.json({ error: "Database unavailable" }, 503);

    const { formFields, provenanceEvents } = await import("@chapterai/db");
    const { createProvenanceEvent } = await import("@chapterai/provenance");

    const [field] = await db
      .select()
      .from(formFields)
      .where(and(eq(formFields.id, fieldId), eq(formFields.firmId, session.firmId)))
      .limit(1);

    if (!field) return c.json({ error: "Field not found" }, 404);

    const approvedValue = body.approvedValue ?? field.proposedValue;
    const [updated] = await db
      .update(formFields)
      .set({
        approvalState: "approved",
        approvedValue,
        approvedByUserId: session.userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(formFields.id, fieldId))
      .returning();

    await db.insert(provenanceEvents).values({
      formFieldId: fieldId,
      matterId: field.matterId,
      firmId: session.firmId,
      eventType: "attorney_approved",
      previousValue: field.proposedValue,
      newValue: approvedValue,
      actorUserId: session.userId,
      confidence: field.confidence,
    });

    return c.json({
      field: updated,
      provenance: createProvenanceEvent({
        formFieldId: fieldId,
        matterId: field.matterId,
        firmId: session.firmId,
        eventType: "attorney_approved",
        previousValue: field.proposedValue,
        newValue: approvedValue,
        actorUserId: session.userId,
      }),
    });
  }
);

formFieldsRouter.post(
  "/bulk-approve",
  zValidator("json", BulkApproveSchema),
  async (c) => {
    const session = c.get("session");
    const { matterId, minConfidence } = c.req.valid("json");

    if (isDemoMatter(matterId)) {
      const fields = getDemoReviewFields(matterId);
      let approvedCount = 0;
      for (const field of fields) {
        if (field.approvalState === "pending" && field.confidence >= minConfidence) {
          updateDemoFieldApproval(matterId, field.id, "approved");
          approvedCount += 1;
        }
      }
      return c.json({
        approvedCount,
        skippedCount: fields.length - approvedCount,
        disclaimer: "Bulk approval logged with confidence threshold",
      });
    }

    const db = await getDbSafe();
    if (!db) return c.json({ error: "Database unavailable" }, 503);

    const { formFields, provenanceEvents } = await import("@chapterai/db");
    const pending = await db
      .select()
      .from(formFields)
      .where(
        and(
          eq(formFields.matterId, matterId),
          eq(formFields.firmId, session.firmId),
          eq(formFields.approvalState, "pending")
        )
      );

    let approvedCount = 0;
    for (const field of pending) {
      if (!field.confidence || parseFloat(field.confidence) < minConfidence) continue;
      await db
        .update(formFields)
        .set({
          approvalState: "approved",
          approvedValue: field.proposedValue,
          approvedByUserId: session.userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(formFields.id, field.id));
      approvedCount += 1;
    }

    return c.json({ approvedCount, skippedCount: pending.length - approvedCount });
  }
);

formFieldsRouter.post("/:fieldId/question", async (c) => {
  const fieldId = c.req.param("fieldId");
  const matterId = c.req.header("x-matter-id") ?? "demo";

  if (isDemoMatter(matterId)) {
    const field = updateDemoFieldApproval(matterId, fieldId, "questioned");
    if (!field) return c.json({ error: "Field not found" }, 404);
    return c.json({ field });
  }

  return c.json({ error: "Not implemented for DB matters yet" }, 501);
});
