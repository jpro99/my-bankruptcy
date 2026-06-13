import { describe, expect, it } from "vitest";
import {
  generateTimeline,
  completeTask,
  getAutoActionPayload,
  AUTOPILOT_TASK_COUNT,
} from "../engine.js";

describe("Autopilot engine", () => {
  const input = {
    matterId: "demo",
    caseNumber: "2:26-bk-04821",
    chapter: "7" as const,
    filingDate: "2026-06-01",
  };

  it("generates Ch 7 post-petition tasks", () => {
    const timeline = generateTimeline(input);
    expect(timeline.tasks.length).toBeGreaterThanOrEqual(6);
    expect(timeline.tasks.some((t) => t.category === "341_meeting")).toBe(true);
    expect(timeline.summary.total).toBe(timeline.tasks.length);
  });

  it("includes Ch 13 plan payment for chapter 13", () => {
    const timeline = generateTimeline({ ...input, chapter: "13" });
    expect(timeline.tasks.some((t) => t.title.includes("plan payment"))).toBe(true);
  });

  it("marks overdue tasks correctly", () => {
    const timeline = generateTimeline({
      ...input,
      filingDate: "2020-01-01",
    });
    expect(timeline.summary.overdue).toBeGreaterThan(0);
  });

  it("completes a task", () => {
    const timeline = generateTimeline(input);
    const taskId = timeline.tasks[0]!.id;
    const updated = completeTask(timeline, taskId);
    expect(updated.summary.completed).toBe(1);
  });

  it("generates auto-action payloads", () => {
    const timeline = generateTimeline(input);
    const prep = timeline.tasks.find((t) => t.autoAction === "generate_341_prep");
    expect(prep).toBeDefined();
    const payload = getAutoActionPayload(prep!);
    expect(payload?.type).toBe("341_prep_packet");
  });

  it("tracks template count", () => {
    expect(AUTOPILOT_TASK_COUNT).toBeGreaterThanOrEqual(10);
  });
});
