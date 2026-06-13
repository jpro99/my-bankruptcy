import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getAgreementText,
  registerFirm,
  type CounselingProvider,
  type CounselingTier,
} from "../lib/firm-store.js";

export const firmsRouter = new Hono();

firmsRouter.get("/agreement", (c) => {
  return c.json({ version: "2025-06-12-v1", text: getAgreementText() });
});

const SignupSchema = z.object({
  firmName: z.string().min(1),
  attorneyFirstName: z.string().min(1),
  attorneyLastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  state: z.string().default("CA"),
  counselingTier: z.enum(["gold", "relay", "vault"]),
  counselingProvider: z.enum(["debtorcc", "bkcert", "advantagecc", "creditorg"]),
  agreementAccepted: z.literal(true),
});

firmsRouter.post("/signup", zValidator("json", SignupSchema), async (c) => {
  const body = c.req.valid("json");
  try {
    const firm = registerFirm(body);
    return c.json({
      firmId: firm.id,
      firmName: firm.firmName,
      email: firm.email,
      counselingTier: firm.counselingTier as CounselingTier,
      counselingProvider: firm.counselingProvider as CounselingProvider,
      message: "Welcome to My Bankruptcy — your firm is ready.",
      demoMatterUrl: "/matters/demo/command",
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Signup failed" }, 400);
  }
});
