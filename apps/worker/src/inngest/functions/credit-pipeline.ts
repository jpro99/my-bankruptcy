import {
  createCreditProvider,
  classifyCreditTradelines,
  scheduleSummary,
} from "@chapterai/credit";
import {
  evaluateUnifiedMeansTest,
  buildDiagnosticsPayload,
} from "@chapterai/means-test";
import { inngest } from "../client.js";

export const classifyCreditTradelinesJob = inngest.createFunction(
  { id: "intake-classify-credit", retries: 2 },
  { event: "credit/pull.completed" },
  async ({ event, step }) => {
    const { matterId, firmId, tradelines, annualIncome, householdSize, chapter } = event.data;

    const classified = await step.run("classify-tradelines", async () => {
      return classifyCreditTradelines(tradelines);
    });

    const summary = await step.run("summarize-schedules", async () => {
      return scheduleSummary(classified);
    });

    const diagnostics = await step.run("compute-diagnostics", async () => {
      const securedPayments = classified
        .filter((t) => t.schedule === "D")
        .reduce((acc, t) => acc + parseFloat(t.monthlyPayment ?? "0"), 0)
        .toFixed(2);

      const meansTest = evaluateUnifiedMeansTest({
        chapter: chapter ?? "7",
        householdSize: householdSize ?? 2,
        annualIncome: annualIncome ?? "72000.00",
        deductions: {
          livingExpenses: "3200.00",
          securedDebtPayments: securedPayments,
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

      return buildDiagnosticsPayload({
        meansTest,
        creditSummary: summary,
        missingFields: 0,
        exemptionGaps: 0,
      });
    });

    await step.sendEvent("schedules-populated", {
      name: "matter/schedules.populated",
      data: { matterId, firmId, diagnostics, classifiedCount: classified.length },
    });

    return { classified: classified.length, summary, diagnostics };
  }
);

export const triggerCreditPull = inngest.createFunction(
  { id: "credit-pull-trigger", retries: 1 },
  { event: "credit/pull.requested" },
  async ({ event, step }) => {
    const { matterId, firmId, debtorFirstName, debtorLastName, ssnLast4 } = event.data;

    const pull = await step.run("pull-tri-merge", async () => {
      const provider = createCreditProvider();
      return provider.pullTriMerge({
        matterId,
        firmId,
        debtorFirstName,
        debtorLastName,
        ssnLast4,
        consentTimestamp: new Date().toISOString(),
      });
    });

    await step.sendEvent("credit-completed", {
      name: "credit/pull.completed",
      data: {
        matterId,
        firmId,
        pullId: pull.pullId,
        tradelines: pull.tradelines,
        annualIncome: event.data.annualIncome,
        householdSize: event.data.householdSize,
        chapter: event.data.chapter,
      },
    });

    return { pullId: pull.pullId, tradelineCount: pull.tradelines.length };
  }
);
