import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { FIRM_ATTORNEY_NAME } from "../lib/firm-brand.js";
import { importTestDataFromCsv } from "../lib/test-data-csv.js";
import type { AppEnv } from "../index.js";
import {
  addIntakeDocument,
  addMatterNote,
  applyPendingIntake,
  createDemoMatter,
  getIntakeDocument,
  getIntakeDossier,
  getMatterNotes,
  isDemoMatter,
  listDemoMatters,
  movePendingIntakeDocuments,
  previewForgeSyncIdentity,
  previewIntakeUpload,
  saveConsultSnapshot,
} from "../lib/demo-store.js";
import { readMatterDocument } from "../lib/document-storage.js";
import { processIntakeFileUpload, readUploadFormFile } from "../lib/intake-upload.js";

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
      authorLabel: body.source === "voice" ? "Matter Notes (voice)" : FIRM_ATTORNEY_NAME,
    });
    return c.json({ note }, 201);
  }
);

const MAX_AUDIO_BYTES = 18 * 1024 * 1024;

intakeMatterRouter.post("/matter/:matterId/recording", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: "Expected multipart form data" }, 400);
  }

  const audio = form.get("audio");
  if (!audio || typeof audio === "string") {
    return c.json({ error: "Missing audio file" }, 400);
  }

  const buf = Buffer.from(await (audio as Blob).arrayBuffer());
  if (buf.length === 0) return c.json({ error: "Empty recording" }, 400);
  if (buf.length > MAX_AUDIO_BYTES) {
    return c.json(
      {
        error: `Recording too large (max ${Math.round(MAX_AUDIO_BYTES / (1024 * 1024))} MB). Try a shorter clip.`,
      },
      413
    );
  }

  const mimeRaw =
    (audio as Blob).type ||
    String(form.get("mimeType") || "").trim() ||
    "audio/webm";
  const mimeType = mimeRaw.split(";")[0]!.trim() || "audio/webm";

  const { transcribeRecordingAudio, summarizeRecordingTranscript, buildRecordingNoteText } =
    await import("../lib/matter-recording.js");

  let transcript: string;
  let engine: string;
  try {
    const t = await transcribeRecordingAudio(buf, mimeType);
    transcript = t.text;
    engine = t.engine;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transcription failed";
    return c.json({ error: msg }, 502);
  }

  if (/^\(no speech detected\)/i.test(transcript) || transcript.length < 3) {
    return c.json(
      {
        error:
          "No usable speech detected. Check the microphone, speaker volume, or try again closer to the mic.",
      },
      422
    );
  }

  const summary = summarizeRecordingTranscript(transcript);
  const noteText = buildRecordingNoteText({
    title: summary.title,
    synopsis: summary.synopsis,
    transcript,
    engine,
  });

  const note = addMatterNote(matterId, {
    text: noteText,
    source: "voice",
    authorLabel: "Field capture (recording)",
  });

  return c.json({
    ok: true,
    title: summary.title,
    entry: { title: summary.title, synopsis: summary.synopsis, at: note.createdAt },
    note,
  });
});

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
  confirmMismatch: z.boolean().optional(),
  targetMatterId: z.string().optional(),
});

intakeMatterRouter.post(
  "/matter/:matterId/upload/preview",
  zValidator("json", UploadSchema.pick({ fileName: true, documentType: true })),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    return c.json({ preview: previewIntakeUpload(matterId, body.fileName, body.documentType) });
  }
);

intakeMatterRouter.post(
  "/matter/:matterId/upload",
  zValidator("json", UploadSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    const preview = previewIntakeUpload(matterId, body.fileName, body.documentType);

    if (preview.action === "confirm" && !body.confirmMismatch && !body.targetMatterId) {
      return c.json({ error: "matter_mismatch", preview }, 409);
    }

    let finalMatterId = matterId;
    if (body.targetMatterId && isDemoMatter(body.targetMatterId)) {
      finalMatterId = body.targetMatterId;
    }

    const document = addIntakeDocument(finalMatterId, {
      fileName: body.fileName,
      documentType: body.documentType,
      uploadedBy: "attorney",
      source: "attorney_drop",
      mimeType: body.mimeType,
    });

    if (finalMatterId !== matterId) {
      addMatterNote(finalMatterId, {
        text: `Document filed here (identity match): ${body.fileName}`,
        source: "system",
        authorLabel: "Smart match",
      });
      addMatterNote(matterId, {
        text: `Upload redirected — ${body.fileName} matched ${preview.bestMatch?.debtorDisplayName ?? finalMatterId}'s file`,
        source: "system",
        authorLabel: "Smart match",
      });
    }

    return c.json({ document, savedToMatterId: finalMatterId, preview }, 201);
  }
);

intakeMatterRouter.post("/matter/:matterId/upload/file", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);

  const session = c.get("session");
  let formFile;
  try {
    formFile = await readUploadFormFile(c);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid upload";
    const status = message.includes("too large") ? 413 : 400;
    return c.json({ error: message }, status);
  }

  try {
    const result = await processIntakeFileUpload({
      matterId,
      firmId: session.firmId,
      fileName: formFile.fileName,
      documentType: formFile.documentType,
      mimeType: formFile.mimeType,
      body: formFile.body,
      uploadedBy: "attorney",
      source: "attorney_drop",
      confirmMismatch: formFile.confirmMismatch,
      targetMatterId: formFile.targetMatterId,
    });

    if (!result.ok) {
      return c.json({ error: "matter_mismatch", preview: result.preview }, 409);
    }

    console.info(
      `[intake] document uploaded matterId=${result.savedToMatterId} documentId=${result.document.id} stored=${result.document.stored === true}`
    );

    return c.json(
      {
        document: result.document,
        savedToMatterId: result.savedToMatterId,
        preview: result.preview,
      },
      201
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return c.json({ error: message }, 400);
  }
});

intakeMatterRouter.get("/matter/:matterId/documents/:documentId/file", async (c) => {
  const matterId = c.req.param("matterId");
  const documentId = c.req.param("documentId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);

  const doc = getIntakeDocument(matterId, documentId);
  if (!doc?.storageKey) {
    return c.json({ error: "Document file not available" }, 404);
  }

  try {
    const file = await readMatterDocument(doc.storageKey);
    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return c.json({ error: "Document file not available" }, 404);
  }
});

intakeMatterRouter.get("/matter/:matterId/apply/preview", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ preview: previewForgeSyncIdentity(matterId) });
});

const ApplySchema = z.object({
  confirmMismatch: z.boolean().optional(),
  targetMatterId: z.string().optional(),
}).default({});

intakeMatterRouter.post(
  "/matter/:matterId/apply",
  zValidator("json", ApplySchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");

    const preview = previewForgeSyncIdentity(matterId);
    if (preview?.action === "confirm" && !body.confirmMismatch && !body.targetMatterId) {
      return c.json({ error: "matter_mismatch", preview }, 409);
    }

    if (
      preview?.action === "confirm" &&
      body.targetMatterId &&
      isDemoMatter(body.targetMatterId)
    ) {
      movePendingIntakeDocuments(matterId, body.targetMatterId);
      const result = applyPendingIntake(body.targetMatterId);
      return c.json({ ...result, redirectedTo: body.targetMatterId, preview });
    }

    const result = applyPendingIntake(matterId);
    return c.json(result);
  }
);

intakeMatterRouter.post(
  "/matter/:matterId/import-test-csv",
  zValidator("json", z.object({ csv: z.string().min(1) })),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const { csv } = c.req.valid("json");
    try {
      const result = importTestDataFromCsv(matterId, csv);
      return c.json({ result });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Import failed";
      return c.json({ error: message }, 400);
    }
  }
);
