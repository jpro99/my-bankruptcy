import { z } from "zod";
import { createHash } from "node:crypto";

export const BoundingBoxSchema = z.object({
  page: z.number().int().positive(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const ProvenanceEventTypeSchema = z.enum([
  "ai_extracted",
  "attorney_approved",
  "attorney_edited",
  "attorney_questioned",
  "system_computed",
  "credit_imported",
]);

export type ProvenanceEventType = z.infer<typeof ProvenanceEventTypeSchema>;

export const ProvenanceRecordSchema = z.object({
  id: z.string().uuid(),
  formFieldId: z.string().uuid(),
  matterId: z.string().uuid(),
  firmId: z.string().uuid(),
  eventType: ProvenanceEventTypeSchema,
  previousValue: z.unknown().optional(),
  newValue: z.unknown(),
  sourceDocumentId: z.string().uuid().optional(),
  boundingBox: BoundingBoxSchema.optional(),
  modelName: z.string().optional(),
  modelVersion: z.string().optional(),
  promptHash: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  actorUserId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type ProvenanceRecord = z.infer<typeof ProvenanceRecordSchema>;

export interface CreateProvenanceEventInput {
  formFieldId: string;
  matterId: string;
  firmId: string;
  eventType: ProvenanceEventType;
  previousValue?: unknown;
  newValue: unknown;
  sourceDocumentId?: string;
  boundingBox?: BoundingBox;
  modelName?: string;
  modelVersion?: string;
  prompt?: string;
  confidence?: number;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

export function createProvenanceEvent(
  input: CreateProvenanceEventInput
): Omit<ProvenanceRecord, "id" | "createdAt"> & { promptHash?: string } {
  return {
    formFieldId: input.formFieldId,
    matterId: input.matterId,
    firmId: input.firmId,
    eventType: input.eventType,
    previousValue: input.previousValue,
    newValue: input.newValue,
    sourceDocumentId: input.sourceDocumentId,
    boundingBox: input.boundingBox,
    modelName: input.modelName,
    modelVersion: input.modelVersion,
    promptHash: input.prompt ? hashPrompt(input.prompt) : undefined,
    confidence: input.confidence,
    actorUserId: input.actorUserId,
    metadata: input.metadata,
  };
}

export function exportProvenanceBundle(
  events: ProvenanceRecord[],
  matterId: string
): {
  matterId: string;
  exportedAt: string;
  eventCount: number;
  events: ProvenanceRecord[];
  integrityHash: string;
} {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const payload = JSON.stringify(sorted);
  const integrityHash = createHash("sha256").update(payload).digest("hex");

  return {
    matterId,
    exportedAt: new Date().toISOString(),
    eventCount: sorted.length,
    events: sorted,
    integrityHash,
  };
}
