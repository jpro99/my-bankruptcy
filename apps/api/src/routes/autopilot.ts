import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  completeTask,
  dismissTask,
  generateTimeline,
  getAutoActionPayload,
} from "@chapterai/autopilot";
import type { AppEnv } from "../index.js";
import {
  getDemoAutopilot,
  getDemoFiling,
  getDemoMatterMeta,
  isDemoMatter,
  setDemoAutopilot,
} from "../lib/demo-store.js";

export const autopilotRouter = new Hono<AppEnv>();

autopilotRouter.get("/matter/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  let timeline = getDemoAutopilot(matterId);
  const filing = getDemoFiling(matterId);

  if (!timeline && filing) {
    const meta = getDemoMatterMeta(matterId);
    timeline = generateTimeline({
      matterId,
      caseNumber: filing.caseNumber,
      chapter: meta.chapter,
      filingDate: filing.filedAt.slice(0, 10),
    });
    setDemoAutopilot(matterId, timeline);
  }

  if (!timeline) {
    return c.json({
      matterId,
      filed: false,
      timeline: null,
      message: "File the petition to activate post-petition autopilot",
    });
  }

  return c.json({ matterId, filed: true, timeline });
});

const TaskActionSchema = z.object({
  action: z.enum(["complete", "dismiss", "run-auto"]),
});

autopilotRouter.post("/matter/:matterId/tasks/:taskId", zValidator("json", TaskActionSchema), async (c) => {
  const matterId = c.req.param("matterId");
  const taskId = c.req.param("taskId");
  const { action } = c.req.valid("json");

  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  let timeline = getDemoAutopilot(matterId);
  if (!timeline) {
    return c.json({ error: "Autopilot not active — file petition first" }, 400);
  }

  const task = timeline.tasks.find((t) => t.id === taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  if (action === "complete") {
    timeline = completeTask(timeline, taskId);
  } else if (action === "dismiss") {
    timeline = dismissTask(timeline, taskId);
  } else if (action === "run-auto") {
    const payload = getAutoActionPayload(task);
    setDemoAutopilot(matterId, timeline);
    return c.json({ task, autoActionResult: payload });
  }

  setDemoAutopilot(matterId, timeline);
  return c.json({ timeline });
});

autopilotRouter.post("/matter/:matterId/refresh", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const filing = getDemoFiling(matterId);
  if (!filing) {
    return c.json({ error: "Matter not filed" }, 400);
  }

  const meta = getDemoMatterMeta(matterId);
  const timeline = generateTimeline({
    matterId,
    caseNumber: filing.caseNumber,
    chapter: meta.chapter,
    filingDate: filing.filedAt.slice(0, 10),
  });
  setDemoAutopilot(matterId, timeline);
  return c.json({ timeline });
});
