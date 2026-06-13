import { networkInterfaces } from "node:os";
import { serve } from "@hono/node-server";
import app from "./index.js";
import { ensureTestDemoMatters } from "./lib/demo-store.js";

ensureTestDemoMatters();

const port = parseInt(process.env.PORT ?? "3002", 10);
const hostname = process.env.HOST ?? "0.0.0.0";

function getLanIp(): string | undefined {
  for (const nets of Object.values(networkInterfaces())) {
    if (!nets) continue;
    for (const net of nets) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return undefined;
}

serve({ fetch: app.fetch, port, hostname }, () => {
  const lan = getLanIp();
  console.log(`ChapterAI API listening on http://localhost:${port}`);
  if (lan) console.log(`  Network: http://${lan}:${port}`);
});
