import { getAutoActionPayload } from "@chapterai/autopilot";
import { inngest } from "../client.js";

export const autopilotDailyTick = inngest.createFunction(
  { id: "autopilot-daily-tick", retries: 1 },
  { cron: "0 6 * * *" },
  async ({ step }) => {
    await step.run("log-tick", async () => {
      return { tickAt: new Date().toISOString(), message: "Autopilot daily deadline scan" };
    });
    return { ok: true };
  }
);

export const autopilotRunAutoAction = inngest.createFunction(
  { id: "autopilot-run-auto-action", retries: 1 },
  { event: "autopilot/task.auto-run" },
  async ({ event, step }) => {
    const { matterId, task } = event.data;

    const payload = await step.run("execute-auto-action", async () => {
      return getAutoActionPayload(task);
    });

    await step.sendEvent("auto-action-done", {
      name: "autopilot/task.auto-completed",
      data: { matterId, taskId: task.id, payload },
    });

    return { payload };
  }
);

export const autopilotTimelineReady = inngest.createFunction(
  { id: "autopilot-timeline-ready", retries: 1 },
  { event: "autopilot/timeline.ready" },
  async ({ event, step }) => {
    const { matterId, timeline } = event.data;

    const critical = await step.run("find-critical-tasks", async () => {
      return timeline.tasks.filter(
        (t: { priority: string; status: string }) =>
          t.priority === "critical" && t.status !== "completed"
      );
    });

    return { matterId, criticalCount: critical.length };
  }
);
