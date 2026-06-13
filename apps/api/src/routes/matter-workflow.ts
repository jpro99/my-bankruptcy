import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../index.js";
import {
  getCalendarEvents,
  getFinalReview,
  getMatterProfile,
  isDemoMatter,
  updateFinalReviewStep,
  updateMatterProfile,
  verifyIntakeDocument,
} from "../lib/demo-store.js";

export const matterWorkflowRouter = new Hono<AppEnv>();

matterWorkflowRouter.get("/matter/:matterId/profile", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ profile: getMatterProfile(matterId) });
});

matterWorkflowRouter.patch(
  "/matter/:matterId/profile",
  zValidator(
    "json",
    z.object({
      clientEmail: z.string().email().optional(),
      clientPhone: z.string().optional(),
      clientFirstName: z.string().optional(),
      clientLastName: z.string().optional(),
      debtorDisplayName: z.string().optional(),
    })
  ),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const profile = updateMatterProfile(matterId, c.req.valid("json"));
    return c.json({ profile });
  }
);

matterWorkflowRouter.get("/matter/:matterId/final-review", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ finalReview: getFinalReview(matterId) });
});

matterWorkflowRouter.post(
  "/matter/:matterId/final-review/:step",
  zValidator(
    "json",
    z.object({
      complete: z.boolean(),
      attorneyName: z.string().optional(),
    })
  ),
  async (c) => {
    const matterId = c.req.param("matterId");
    const step = c.req.param("step") as "documentsQa" | "numbersQa" | "attorneySignOff";
    if (!["documentsQa", "numbersQa", "attorneySignOff"].includes(step)) {
      return c.json({ error: "Invalid step" }, 400);
    }
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    const finalReview = updateFinalReviewStep(matterId, step, body);
    return c.json({ finalReview });
  }
);

matterWorkflowRouter.post(
  "/matter/:matterId/documents/:documentId/verify",
  zValidator(
    "json",
    z.object({
      verified: z.boolean(),
      note: z.string().optional(),
    })
  ),
  async (c) => {
    const matterId = c.req.param("matterId");
    const documentId = c.req.param("documentId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const session = c.get("session");
    const body = c.req.valid("json");
    const document = verifyIntakeDocument(matterId, documentId, {
      ...body,
      verifiedBy: session.email,
    });
    if (!document) return c.json({ error: "Document not found" }, 404);
    return c.json({ document, finalReview: getFinalReview(matterId) });
  }
);

matterWorkflowRouter.get("/matter/:matterId/calendar", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  return c.json({ events: getCalendarEvents(matterId) });
});
