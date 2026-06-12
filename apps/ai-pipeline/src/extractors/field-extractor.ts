import { z } from "zod";
import type { FormId } from "@chapterai/forms";
import { createProvenanceEvent, type BoundingBox } from "@chapterai/provenance";

export interface ExtractionModelConfig {
  primaryModel: string;
  primaryVersion: string;
  crossCheckModel: string;
  crossCheckVersion: string;
}

export const DEFAULT_MODEL_CONFIG: ExtractionModelConfig = {
  primaryModel: "claude-sonnet-4-20250514",
  primaryVersion: "20250514",
  crossCheckModel: "gpt-4.1",
  crossCheckVersion: "20250414",
};

export interface ExtractedFieldCandidate {
  fieldPath: string;
  value: unknown;
  confidence: number;
  sourceDocumentId?: string;
  boundingBox?: BoundingBox;
  rationale?: string;
}

export interface ExtractionRequest {
  matterId: string;
  firmId: string;
  documentId: string;
  redactedText: string;
  targetForm: FormId;
  promptHash: string;
}

export interface ExtractionResult {
  fields: ExtractedFieldCandidate[];
  modelName: string;
  modelVersion: string;
  processingMs: number;
}

/** Simulated extraction for Phase 1 — replaced with real Claude/GPT calls when API keys present */
export function extractFieldsFromDocument(
  request: ExtractionRequest,
  config: ExtractionModelConfig = DEFAULT_MODEL_CONFIG
): ExtractionResult {
  const start = Date.now();
  const fields: ExtractedFieldCandidate[] = [];

  if (request.targetForm === "106I") {
    const incomeMatch = request.redactedText.match(/(?:gross|total).*?\$?([\d,]+\.?\d*)/i);
    if (incomeMatch?.[1]) {
      const amount = incomeMatch[1].replace(/,/g, "");
      fields.push({
        fieldPath: "debtor1MonthlyIncome",
        value: (parseFloat(amount) / 12).toFixed(2),
        confidence: 0.92,
        sourceDocumentId: request.documentId,
        rationale: "Extracted gross annual income from paystub, divided by 12",
      });
    }
  }

  if (request.targetForm === "106A/B") {
    const propertyMatch = request.redactedText.match(
      /(?:residence|property|home).*?\$?([\d,]+\.?\d*)/i
    );
    if (propertyMatch?.[1]) {
      fields.push({
        fieldPath: "realProperty.0.currentValue",
        value: propertyMatch[1].replace(/,/g, ""),
        confidence: 0.88,
        sourceDocumentId: request.documentId,
        boundingBox: { page: 1, x: 0.1, y: 0.3, width: 0.4, height: 0.05 },
        rationale: "Extracted property value from document",
      });
    }
  }

  return {
    fields,
    modelName: config.primaryModel,
    modelVersion: config.primaryVersion,
    processingMs: Date.now() - start,
  };
}

export function crossCheckFields(
  primary: ExtractedFieldCandidate[],
  secondary: ExtractedFieldCandidate[]
): ExtractedFieldCandidate[] {
  const secondaryMap = new Map(secondary.map((f) => [f.fieldPath, f]));

  return primary.map((field) => {
    const cross = secondaryMap.get(field.fieldPath);
    if (!cross) {
      return { ...field, confidence: field.confidence * 0.85 };
    }

    const valuesMatch = JSON.stringify(field.value) === JSON.stringify(cross.value);
    if (valuesMatch) {
      return { ...field, confidence: Math.min(field.confidence + 0.05, 0.99) };
    }

    return {
      ...field,
      confidence: Math.min(field.confidence, cross.confidence) * 0.5,
      rationale: `${field.rationale ?? ""} [DISAGREEMENT: cross-check differs]`.trim(),
    };
  });
}

export function fieldsToProvenanceEvents(
  fields: ExtractedFieldCandidate[],
  ctx: { matterId: string; firmId: string; formFieldIds: Map<string, string> },
  model: ExtractionModelConfig
) {
  return fields.map((field) => {
    const formFieldId = ctx.formFieldIds.get(field.fieldPath);
    if (!formFieldId) {
      throw new Error(`No form field ID for path: ${field.fieldPath}`);
    }
    return createProvenanceEvent({
      formFieldId,
      matterId: ctx.matterId,
      firmId: ctx.firmId,
      eventType: "ai_extracted",
      newValue: field.value,
      sourceDocumentId: field.sourceDocumentId,
      boundingBox: field.boundingBox,
      modelName: model.primaryModel,
      modelVersion: model.primaryVersion,
      confidence: field.confidence,
      metadata: { rationale: field.rationale },
    });
  });
}
