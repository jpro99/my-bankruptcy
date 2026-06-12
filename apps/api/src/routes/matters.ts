import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb, matters, parties } from "@chapterai/db";
import type { AppEnv } from "../index.js";

const CreateMatterSchema = z.object({
  chapter: z.enum(["7", "13"]).default("7"),
  district: z.enum(["CACB", "CAEB", "CANB", "CASB"]).default("CACB"),
  debtorDisplayName: z.string().min(1),
  debtor1: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    ssnLast4: z.string().regex(/^\d{4}$/),
  }),
});

export const mattersRouter = new Hono<AppEnv>();

mattersRouter.get("/", async (c) => {
  const session = c.get("session");
  const db = getDb();
  const results = await db
    .select()
    .from(matters)
    .where(eq(matters.firmId, session.firmId))
    .limit(50);
  return c.json({ matters: results });
});

mattersRouter.get("/:matterId", async (c) => {
  const session = c.get("session");
  const matterId = c.req.param("matterId");
  const db = getDb();

  const [matter] = await db
    .select()
    .from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.firmId, session.firmId)))
    .limit(1);

  if (!matter) {
    return c.json({ error: "Matter not found" }, 404);
  }

  const matterParties = await db
    .select()
    .from(parties)
    .where(eq(parties.matterId, matterId));

  return c.json({ matter, parties: matterParties });
});

mattersRouter.post("/", zValidator("json", CreateMatterSchema), async (c) => {
  const session = c.get("session");
  const body = c.req.valid("json");
  const db = getDb();

  const [matter] = await db
    .insert(matters)
    .values({
      firmId: session.firmId,
      createdByUserId: session.userId,
      chapter: body.chapter,
      district: body.district,
      debtorDisplayName: body.debtorDisplayName,
      status: "intake",
    })
    .returning();

  if (!matter) {
    return c.json({ error: "Failed to create matter" }, 500);
  }

  await db.insert(parties).values({
    matterId: matter.id,
    firmId: session.firmId,
    role: "debtor1",
    firstName: body.debtor1.firstName,
    lastName: body.debtor1.lastName,
    ssnLast4: body.debtor1.ssnLast4,
  });

  return c.json({ matter }, 201);
});

mattersRouter.post("/:matterId/intake/start", async (c) => {
  const session = c.get("session");
  const matterId = c.req.param("matterId");

  const inngestEventKey = process.env.INNGEST_EVENT_KEY;
  if (inngestEventKey) {
    await fetch(`https://inn.gs/e/${inngestEventKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "matter/intake.started",
        data: {
          matterId,
          firmId: session.firmId,
          documentIds: [],
          targetForms: ["106A/B", "106C", "106D", "106E/F", "106I", "106J"],
        },
      }),
    });
  }

  return c.json({ matterId, status: "intake_started" });
});
