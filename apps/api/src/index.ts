import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { resolveSession, AuthError } from "@chapterai/auth";
import { mattersRouter } from "./routes/matters.js";
import { documentsRouter } from "./routes/documents.js";
import { formFieldsRouter } from "./routes/form-fields.js";
import { creditRouter, diagnosticsRouter } from "./routes/credit.js";
import { planRouter, preflightRouter } from "./routes/plan-preflight.js";
import { efileRouter } from "./routes/efile.js";
import { autopilotRouter } from "./routes/autopilot.js";
import { billingRouter } from "./routes/billing.js";
import { commandRouter } from "./routes/command.js";
import { portalRouter } from "./routes/portal.js";
import { firmsRouter } from "./routes/firms.js";
import {
  schedulesRouter,
  districtsRouter,
  provenanceRouter,
} from "./routes/schedules-districts-provenance.js";

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
      const webUrl = process.env.WEB_URL;
      if (!origin) return webUrl ?? "http://localhost:3000";
      if (process.env.NODE_ENV !== "production") {
        if (/^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3})(:\d+)?$/.test(origin)) {
          return origin;
        }
      }
      if (webUrl && origin === webUrl) return origin;
      // Vercel production + preview deployments
      if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return origin;
      return webUrl ?? "http://localhost:3000";
    },
    credentials: true,
  })
);

app.get("/health", (c) =>
  c.json({ status: "ok", service: "my-bankruptcy-api", version: "0.8.0" })
);

/** Public routes — no attorney auth */
app.route("/api/portal", portalRouter);
app.route("/api/firms", firmsRouter);

app.use("/api/*", async (c, next) => {
  if (c.req.path.startsWith("/api/portal") || c.req.path.startsWith("/api/firms")) {
    await next();
    return;
  }
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
app.route("/api/efile", efileRouter);
app.route("/api/autopilot", autopilotRouter);
app.route("/api/billing", billingRouter);
app.route("/api/command", commandRouter);
app.route("/api/schedules", schedulesRouter);
app.route("/api/districts", districtsRouter);
app.route("/api/provenance", provenanceRouter);

app.onError((err, c) => {
  if (err instanceof AuthError) {
    return c.json({ error: err.message }, err.statusCode as 403);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
