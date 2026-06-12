import { serve } from "inngest/hono";
import { Hono } from "hono";
import { inngest, functions } from "./inngest/index.js";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", service: "chapterai-worker" }));

app.on(
  ["GET", "POST", "PUT"],
  "/api/inngest",
  serve({ client: inngest, functions })
);

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`ChapterAI worker listening on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
