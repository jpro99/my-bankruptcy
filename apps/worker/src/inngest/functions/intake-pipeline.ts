import {
  redactPii,
  extractFieldsFromDocument,
  crossCheckFields,
} from "@chapterai/ai-pipeline";
import { optimizeExemptions } from "@chapterai/exemption-optimizer";
import {
  evaluateUnifiedMeansTest,
  buildDiagnosticsPayload,
} from "@chapterai/means-test";
import { inngest } from "../client.js";

export const intakePipelineStarted = inngest.createFunction(
  { id: "intake-pipeline-orchestrator", retries: 3 },
  { event: "matter/intake.started" },
  async ({ event, step }) => {
    const { matterId, firmId, documentIds, targetForms, runCreditPull } = event.data;

    await step.sendEvent("upload-documents", {
      name: "matter/documents.uploaded",
      data: { matterId, firmId, documentIds },
    });

    const parsed = await step.waitForEvent("wait-for-parse", {
      event: "matter/documents.parsed",
      timeout: "5m",
      if: `async.data.matterId == "${matterId}"`,
    });

    if (!parsed) {
      throw new Error(`Document parsing timed out for matter ${matterId}`);
    }

    if (runCreditPull) {
      await step.sendEvent("request-credit-pull", {
        name: "credit/pull.requested",
        data: {
          matterId,
          firmId,
          debtorFirstName: "Maria",
          debtorLastName: "Martinez",
          ssnLast4: "1234",
          annualIncome: "72000.00",
          householdSize: 2,
          chapter: "7",
        },
      });
    } else {
      await step.sendEvent("schedules-populated", {
        name: "matter/schedules.populated",
        data: { matterId, firmId },
      });
    }

    await step.sendEvent("tokenize-documents", {
      name: "matter/documents.tokenized",
      data: { matterId, firmId, tokenizedDocuments: [], targetForms },
    });

    return { matterId, status: "orchestrated", creditPull: !!runCreditPull };
  }
);

export const ingestDocuments = inngest.createFunction(
  { id: "intake-ingest-documents", retries: 2 },
  { event: "matter/documents.uploaded" },
  async ({ event, step }) => {
    const { matterId, firmId, documentIds } = event.data;

    const parsedDocumentIds = await step.run("parse-documents", async () => {
      return documentIds.map((id: string) => id);
    });

    await step.sendEvent("emit-parsed", {
      name: "matter/documents.parsed",
      data: { matterId, firmId, parsedDocumentIds },
    });

    return { parsedDocumentIds };
  }
);

export const redactAndTokenize = inngest.createFunction(
  { id: "intake-redact-pii", retries: 1 },
  { event: "matter/documents.tokenized" },
  async ({ event, step }) => {
    const { matterId, firmId, tokenizedDocuments, targetForms } = event.data;

    const extractedFieldCount = await step.run("extract-fields", async () => {
      let count = 0;
      for (const doc of tokenizedDocuments) {
        for (const form of targetForms) {
          const primary = extractFieldsFromDocument({
            matterId,
            firmId,
            documentId: doc.documentId,
            redactedText: doc.redactedText,
            targetForm: form as "106I",
            promptHash: "phase2-extract",
          });
          const secondary = extractFieldsFromDocument({
            matterId,
            firmId,
            documentId: doc.documentId,
            redactedText: doc.redactedText,
            targetForm: form as "106I",
            promptHash: "phase2-crosscheck",
          });
          count += crossCheckFields(primary.fields, secondary.fields).length;
        }
      }
      return count;
    });

    return { matterId, extractedFieldCount };
  }
);

export const computeMeansTestAndExemptions = inngest.createFunction(
  { id: "intake-compute-legal-engines", retries: 1 },
  { event: "matter/schedules.populated" },
  async ({ event, step }) => {
    const { matterId, firmId } = event.data;

    const results = await step.run("compute-engines", async () => {
      const meansTest = evaluateUnifiedMeansTest({
        chapter: "7",
        householdSize: 2,
        annualIncome: "72000.00",
        deductions: {
          livingExpenses: "3200.00",
          securedDebtPayments: "2470.00",
          priorityClaims: "350.00",
          chapter13AdminExpenses: "0.00",
          retirementContributions: "0.00",
          domesticSupport: "350.00",
          specialCircumstancesExpenses: "0.00",
          healthInsurance: "450.00",
          careExpenses: "0.00",
          domesticViolenceExpenses: "0.00",
          charitableContributions: "0.00",
          educationalExpenses: "0.00",
          otherAdjustments: "0.00",
        },
      });
      const exemptions = optimizeExemptions([
        {
          id: "home",
          category: "homestead",
          description: "Primary residence",
          currentValue: "685000.00",
          equity: "485000.00",
        },
      ]);
      const diagnostics = buildDiagnosticsPayload({ meansTest, exemptionGaps: 0 });
      return { meansTest, exemptions, diagnostics };
    });

    await step.sendEvent("intake-complete", {
      name: "matter/intake.completed",
      data: {
        matterId,
        firmId,
        fieldCount: results.diagnostics.missingFields,
        highConfidenceCount: 0,
        diagnostics: results.diagnostics,
      },
    });

    return results;
  }
);

export const notifyReviewQueueReady = inngest.createFunction(
  { id: "intake-review-ready", retries: 1 },
  { event: "matter/intake.completed" },
  async ({ event }) => {
    const { matterId, fieldCount, highConfidenceCount } = event.data;
    return {
      reviewQueueUrl: `/matters/${matterId}/cockpit`,
      fieldCount,
      highConfidenceCount,
    };
  }
);

export const functions = [
  intakePipelineStarted,
  ingestDocuments,
  redactAndTokenize,
  computeMeansTestAndExemptions,
  notifyReviewQueueReady,
];
