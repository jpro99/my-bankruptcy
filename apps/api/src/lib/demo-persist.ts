import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const STORE_FILE =
  process.env.DEMO_STORE_PATH ?? join(tmpdir(), "my-bankruptcy-demo-store.json");

export function loadDemoStore(store: Map<string, unknown>): void {
  if (!existsSync(STORE_FILE)) return;
  try {
    const raw = readFileSync(STORE_FILE, "utf8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    for (const [matterId, state] of Object.entries(data)) {
      store.set(matterId, state);
    }
  } catch {
    /* ignore corrupt snapshot — start fresh */
  }
}

export function persistDemoStore(store: Map<string, unknown>): void {
  try {
    const dir = dirname(STORE_FILE);
    mkdirSync(dir, { recursive: true });
    const snapshot: Record<string, unknown> = {};
    for (const [matterId, state] of store.entries()) {
      snapshot[matterId] = state;
    }
    writeFileSync(STORE_FILE, JSON.stringify(snapshot), "utf8");
  } catch {
    /* read-only FS on some hosts — in-memory still works for session */
  }
}
