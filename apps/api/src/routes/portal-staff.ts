import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../index.js";
import {
  addPortalStaffMessage,
  getPortalStaffData,
  isDemoMatter,
  markPortalMessagesRead,
} from "../lib/demo-store.js";
import { FIRM_ATTORNEY_NAME } from "../lib/firm-brand.js";
import { portalInviteEmail } from "../lib/follow-up-templates.js";
import { sendTransactionalEmail, getOutboundEmailConfig } from "../lib/outbound-email.js";
import { buildGmailComposeUrl } from "../lib/gmail-url.js";

export const portalStaffRouter = new Hono<AppEnv>();

portalStaffRouter.get("/:matterId", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  const data = getPortalStaffData(matterId);
  return c.json(data);
});

portalStaffRouter.get("/:matterId/messages", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  const { messages } = getPortalStaffData(matterId);
  markPortalMessagesRead(matterId);
  return c.json({ messages });
});

const MessageSchema = z.object({ body: z.string().min(1) });

portalStaffRouter.post(
  "/:matterId/messages",
  zValidator("json", MessageSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const body = c.req.valid("json");
    const session = c.get("session");
    const message = addPortalStaffMessage(matterId, {
      body: body.body,
      direction: "outbound",
      staffAuthor: session.email ?? FIRM_ATTORNEY_NAME,
    });
    return c.json({ message }, 201);
  }
);

const InviteSchema = z.object({
  channel: z.enum(["email", "sms"]),
  recipient: z.string().min(1),
  clientName: z.string().optional(),
});

portalStaffRouter.post(
  "/:matterId/invite",
  zValidator("json", InviteSchema),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
    const input = c.req.valid("json");
    const { portalUrl } = getPortalStaffData(matterId);
    const webBase = process.env.WEB_URL ?? "http://localhost:3000";
    const link = portalUrl.startsWith("http") ? portalUrl : `${webBase}${portalUrl}`;

    if (input.channel === "email") {
      const template = portalInviteEmail({
        clientName: input.clientName,
        portalUrl: link,
      });

      const cfg = getOutboundEmailConfig();
      if (cfg.enabled) {
        const sent = await sendTransactionalEmail({
          to: input.recipient,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
        if (sent.ok) {
          return c.json({
            ok: true,
            link,
            messageId: sent.messageId,
            message: `Client Vault invitation emailed to ${input.recipient}`,
          });
        }
      }

      const mailto = buildGmailComposeUrl({
        to: input.recipient,
        subject: template.subject,
        body: template.text,
      });
      return c.json({
        ok: true,
        link,
        mailto,
        message: cfg.enabled
          ? `Email delivery failed — use mailto for ${input.recipient}`
          : `Portal link ready — Resend not configured; use mailto for ${input.recipient}`,
      });
    }

    return c.json({
      ok: true,
      link,
      message: `Portal link created — copy and text to ${input.recipient}`,
    });
  }
);
