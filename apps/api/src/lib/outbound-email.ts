/** Outbound email — Resend or SMTP (same pattern as Demand Generator) */

export type OutboundEmailConfig = {
  enabled: boolean;
  provider: "resend" | "smtp" | null;
  fromAddress: string | null;
  missing: string[];
};

export function getOutboundEmailConfig(): OutboundEmailConfig {
  const from = process.env.OUTBOUND_EMAIL_FROM?.trim() || null;
  const resendKey = process.env.RESEND_API_KEY?.trim() || "";
  const smtpHost = process.env.SMTP_HOST?.trim() || "";

  if (from && resendKey) {
    return { enabled: true, provider: "resend", fromAddress: from, missing: [] };
  }
  if (from && smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { enabled: true, provider: "smtp", fromAddress: from, missing: [] };
  }

  const missing: string[] = [];
  if (!from) missing.push("OUTBOUND_EMAIL_FROM");
  if (!resendKey && !smtpHost) missing.push("RESEND_API_KEY or SMTP_*");

  return { enabled: false, provider: null, fromAddress: from, missing };
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const cfg = getOutboundEmailConfig();
  if (!cfg.enabled || !cfg.fromAddress) {
    return { ok: false, error: `Email not configured (${cfg.missing.join(", ")})` };
  }

  if (cfg.provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.fromAddress,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? input.text.replace(/\n/g, "<br>"),
        reply_to: input.replyTo,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: data.message ?? `Resend error ${res.status}` };
    }
    return { ok: true, messageId: data.id ?? "sent" };
  }

  return { ok: false, error: "SMTP send not yet wired — use RESEND_API_KEY" };
}
