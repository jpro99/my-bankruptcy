import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../index.js";
import {
  addIntakeDocument,
  addMatterNote,
  applyPendingIntake,
  createDemoMatter,
  getIntakeDossier,
  getMatterNotes,
  isDemoMatter,
  listDemoMatters,
  saveConsultSnapshot,
} from "../lib/demo-store.js";

export const intakeMatterRouter = new Hono<AppEnv>();

intakeMatterRouter.get("/matters", async (c) => {
  return c.json({ matters: listDemoMatters() });
});

intakeMatterRouter.post(
  "/matters",
  zValidator(
    "json",
    z.object({
      debtorDisplayName: z.string().min(1),
      chapter: z.enum(["7", "13"]).optional(),
      county: z.string().optional(),
      clientEmail: z.string().email().optional(),
      clientPhone: z.string().optional(),
      clientFirstName: z.string().optional(),
      clientLastName: z.string().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const matter = createDemoMatter(body);
    return c.json({ matter }, 201);
  }
);

intakeMatterRouter.get("/matter/:matterId/dossier", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ dossier: getIntakeDossier(matterId) });
});

intakeMatterRouter.get("/matter/:matterId/notes", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ notes: getMatterNotes(matterId) });
});

const NoteSchema = z.object({
  text: z.string().min(1),
  source: z.enum(["attorney", "voice", "system"]).optional(),
});

intakeMatterRouter.post(
  "/matter/:matterId/notes",
  zValidator("json", NoteSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    const note = addMatterNote(matterId, {
      text: body.text,
      source: body.source ?? "attorney",
      authorLabel: body.source === "voice" ? "Bench Notes (voice)" : "Attorney",
    });
    return c.json({ note }, 201);
  }
);

const ConsultSchema = z.object({
  debtorName: z.string().min(1),
  householdSize: z.number().int().min(1).max(20),
  annualIncome: z.string(),
  monthlyExpenses: z.string().default("3200.00"),
  securedDebt: z.string().default("0"),
  unsecuredDebt: z.string().default("0"),
  chapterPreference: z.enum(["7", "13", "undecided"]),
  takeCase: z.enum(["yes", "maybe", "no"]).nullable(),
  attorneyNotes: z.string().default(""),
  evaluate: z.boolean().optional(),
});

intakeMatterRouter.post(
  "/matter/:matterId/consult",
  zValidator("json", ConsultSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    const consult = saveConsultSnapshot(matterId, body);
    return c.json({ consult });
  }
);

const UploadSchema = z.object({
  fileName: z.string().min(1),
  documentType: z.string().optional(),
  mimeType: z.string().optional(),
});

intakeMatterRouter.post(
  "/matter/:matterId/upload",
  zValidator("json", UploadSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    const document = addIntakeDocument(matterId, {
      fileName: body.fileName,
      documentType: body.documentType,
      uploadedBy: "attorney",
      source: "attorney_drop",
      mimeType: body.mimeType,
    });
    return c.json({ document }, 201);
  }
);

intakeMatterRouter.post("/matter/:matterId/apply", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  const result = applyPendingIntake(matterId);
  return c.json(result);
});
