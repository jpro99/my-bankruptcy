import { buildFilingPackage } from "@chapterai/efile";
import { submitViaBridge } from "@chapterai/efile-bridge";
import { generateTimeline } from "@chapterai/autopilot";
import { inngest } from "../client.js";

export const efileSubmissionJob = inngest.createFunction(
  { id: "efile-submit-petition", retries: 2 },
  { event: "efile/submit.requested" },
  async ({ event, step }) => {
    const {
      matterId,
      firmId,
      district,
      chapter,
      debtorDisplayName,
      attorneyName,
      approvedFormIds,
    } = event.data;

    const pkg = await step.run("build-package", async () => {
      return buildFilingPackage({
        matterId,
        firmId,
        district: district ?? "CACB",
        chapter: chapter ?? "7",
        debtorDisplayName,
        attorneyName,
        approvedFormIds,
      });
    });

    const result = await step.run("submit-cm-ecf", async () => {
      return submitViaBridge(pkg);
    });

    await step.sendEvent("efile-completed", {
      name: "efile/submit.completed",
      data: {
        matterId,
        firmId,
        chapter,
        result,
      },
    });

    return { caseNumber: result.caseNumber, documentsFiled: result.documentsFiled };
  }
);

export const efileCompletedAutopilotJob = inngest.createFunction(
  { id: "efile-spawn-autopilot", retries: 1 },
  { event: "efile/submit.completed" },
  async ({ event, step }) => {
    const { matterId, result } = event.data;

    const timeline = await step.run("generate-timeline", async () => {
      return generateTimeline({
        matterId,
        caseNumber: result.caseNumber,
        chapter: event.data.chapter ?? "7",
        filingDate: result.filedAt.slice(0, 10),
      });
    });

    await step.sendEvent("autopilot-ready", {
      name: "autopilot/timeline.ready",
      data: { matterId, timeline },
    });

    return { taskCount: timeline.summary.total };
  }
);
