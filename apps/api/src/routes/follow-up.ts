import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../index.js";
import {
  dischargeCongratulationsEmail,
  piCrossSellOnlyEmail,
} from "../lib/follow-up-templates.js";
import { sendTransactionalEmail, getOutboundEmailConfig } from "../lib/outbound-email.js";
import {
  getDemoFiling,
  getDemoMatterMeta,
  isDemoMatter,
  markDischargeFollowUpSent,
  addMatterNote,
} from "../lib/demo-store.js";
import { buildGmailComposeUrl } from "../lib/gmail-url.js";

export const followUpRouter = new Hono<AppEnv>();

followUpRouter.post(
  "/matter/:matterId/discharge",
  zValidator(
    "json",
    z.object({
      clientEmail: z.string().email(),
      includePiCrossSell: z.boolean().default(true),
      sendEmail: z.boolean().default(true),
    })
  ),
  async (c) => {
    const matterId = c.req.param("matterId");
    if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);

    const body = c.req.valid("json");
    const meta = getDemoMatterMeta(matterId);
    const filing = getDemoFiling(matterId);

    const template = body.includePiCrossSell
      ? dischargeCongratulationsEmail({
          debtorName: meta.debtorDisplayName,
          caseNumber: filing?.caseNumber,
          chapter: meta.chapter,
        })
      : piCrossSellOnlyEmail({ debtorName: meta.debtorDisplayName });

    let emailResult: { ok: boolean; messageId?: string; error?: string; mailto?: string } = {
      ok: false,
    };

    if (body.sendEmail) {
      const cfg = getOutboundEmailConfig();
      if (cfg.enabled) {
        const sent = await sendTransactionalEmail({
          to: body.clientEmail,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
        emailResult = sent.ok
          ? { ok: true, messageId: sent.messageId }
          : { ok: false, error: sent.error };
      } else {
        emailResult = {
          ok: false,
          mailto: buildGmailComposeUrl({
            to: body.clientEmail,
            subject: template.subject,
            body: template.text,
          }),
          error: "Resend not configured — use mailto link",
        };
      }
    }

    markDischargeFollowUpSent(matterId, {
      clientEmail: body.clientEmail,
      includePiCrossSell: body.includePiCrossSell,
      sentAt: new Date().toISOString(),
      emailOk: emailResult.ok,
    });

    addMatterNote(matterId, {
      text: `Discharge follow-up${body.includePiCrossSell ? " + PI cross-sell" : ""} sent to ${body.clientEmail}`,
      source: "system",
      authorLabel: "Continuum",
    });

    return c.json({
      success: true,
      template: { subject: template.subject, preview: template.text.slice(0, 200) },
      email: emailResult,
    });
  }
);

followUpRouter.get("/matter/:matterId/discharge/preview", async (c) => {
  const matterId = c.req.param("matterId");
  if (!isDemoMatter(matterId)) return c.json({ error: "Matter not found" }, 404);
  const meta = getDemoMatterMeta(matterId);
  const filing = getDemoFiling(matterId);
  const template = dischargeCongratulationsEmail({
    debtorName: meta.debtorDisplayName,
    caseNumber: filing?.caseNumber,
    chapter: meta.chapter,
  });
  return c.json({ template });
});
