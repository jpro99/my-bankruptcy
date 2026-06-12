import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { resolveSession, AuthError } from "@chapterai/auth";
import { mattersRouter } from "./routes/matters.js";
import { documentsRouter } from "./routes/documents.js";
import { formFieldsRouter } from "./routes/form-fields.js";
import { creditRouter, diagnosticsRouter } from "./routes/credit.js";
import { planRouter, preflightRouter } from "./routes/plan-preflight.js";

export type AppEnv = {
  Variables: {
    session: NonNullable<ReturnType<typeof resolveSession>>;
  };
};

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return process.env.WEB_URL ?? "http://localhost:3000";
      if (process.env.NODE_ENV !== "production") {
        // Allow localhost + LAN IPs during local dev (phone testing)
        if (/^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(origin)) {
          return origin;
        }
      }
      return process.env.WEB_URL ?? "http://localhost:3000";
    },
    credentials: true,
  })
);

app.get("/health", (c) =>
  c.json({ status: "ok", service: "chapterai-api", version: "0.1.0" })
);

app.use("/api/*", async (c, next) => {
  const session = resolveSession(c.req.raw.headers);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session", session);
  await next();
});

app.route("/api/matters", mattersRouter);
app.route("/api/documents", documentsRouter);
app.route("/api/form-fields", formFieldsRouter);
app.route("/api/credit", creditRouter);
app.route("/api/diagnostics", diagnosticsRouter);
app.route("/api/plan", planRouter);
app.route("/api/preflight", preflightRouter);

app.onError((err, c) => {
  if (err instanceof AuthError) {
    return c.json({ error: err.message }, err.statusCode as 403);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
