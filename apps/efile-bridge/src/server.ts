import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { FilingPackageSchema } from "@chapterai/efile";
import { getBridgeStatus, submitViaBridge } from "./index.js";

const app = new Hono();

app.get("/health", (c) =>
  c.json({ status: "ok", service: "chapterai-efile-bridge", version: "0.4.0" })
);

app.get("/status", async (c) => {
  const status = await getBridgeStatus();
  return c.json(status);
});

app.post(
  "/submit",
  zValidator("json", FilingPackageSchema),
  async (c) => {
    const pkg = c.req.valid("json");
    const result = await submitViaBridge(pkg);
    return c.json({ result });
  }
);

const port = Number(process.env.EFILE_BRIDGE_PORT ?? 3003);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
  console.log(`efile-bridge listening on http://0.0.0.0:${port}`);
});

export default app;
