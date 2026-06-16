import { Hono } from "hono";
import type { AppEnv } from "../index.js";
import { getOutboundEmailConfig } from "../lib/outbound-email.js";
import { documentStorageStatus } from "../lib/document-storage.js";
import { PI_FIRM_NAME, PI_FIRM_PHONE, PI_FIRM_URL } from "../lib/follow-up-templates.js";
import { getCourtReadiness } from "@chapterai/districts";

export const integrationsRouter = new Hono<AppEnv>();

/** Platform integration readiness — for attorney admin / deploy checklist */
integrationsRouter.get("/status", async (c) => {
  const email = getOutboundEmailConfig();

  return c.json({
    service: "my-bankruptcy-api",
    version: "0.9.0",
    integrations: {
      database: {
        status: process.env.DATABASE_URL ? "configured" : "demo_mode",
        note: process.env.DATABASE_URL
          ? "Neon PostgreSQL connected"
          : "Using in-memory demo store (demo-* matters)",
      },
      documentStorage: documentStorageStatus(),
      outboundEmail: {
        status: email.enabled ? "live" : "mailto_fallback",
        provider: email.provider,
        fromAddress: email.fromAddress,
        missing: email.missing,
      },
      clientPortal: {
        status: "live",
        note: "HMAC-signed magic links; Resend when OUTBOUND_EMAIL_FROM + RESEND_API_KEY set",
      },
      creditPull: {
        status: process.env.CREDIT_API_KEY ? "configured" : "sandbox",
        note: "Tri-merge classification to Schedules D/E/F/G",
      },
      efile: {
        status: process.env.EFILE_MODE === "live" ? "live_attempt" : "sandbox",
        bridge: process.env.EFILE_BRIDGE_URL ? "configured" : "embedded_sandbox",
        note:
          "Live CM/ECF requires PACER credentials, district profile, and hardened Playwright bridge",
      },
      practiceMode: {
        status: "available",
        note: "Attorney test workspace — full packet preview, edit every form, sandbox e-file only",
      },
      counseling: {
        status: "demo_tiers",
        note: "Gold/Relay/Vault UI ready; AOUST provider API partnership required for auto-cert",
      },
      worker: {
        status: process.env.INNGEST_EVENT_KEY ? "configured" : "optional",
        note: "AI intake pipeline when Inngest key present",
      },
      piCrossSell: {
        status: PI_FIRM_URL || PI_FIRM_PHONE ? "configured" : "defaults",
        firmName: PI_FIRM_NAME,
        url: PI_FIRM_URL || null,
        phone: PI_FIRM_PHONE || null,
      },
    },
    courtConnections: {
      CACB: {
        cmEcf: process.env.EFILE_MODE === "live" ? "live_attempt" : "sandbox",
        localForms: ["3015-1.7", "MML", "341", "3015-1.01"],
        riversideDivision: {
          counties: ["Riverside", "San Bernardino"],
          courthouse: "Riverside Federal Courthouse",
          cmEcfBaseUrl: "https://ecf.cacb.uscourts.gov",
        },
      },
      CAEB: { cmEcf: "district_routing_ready", localForms: ["3015-1.7", "MML"] },
      CANB: { cmEcf: "district_routing_ready", localForms: ["3015-1.7", "MML"] },
      CASB: { cmEcf: "district_routing_ready", localForms: ["3015-1.7", "MML"] },
    },
    riversideCourtReadiness: getCourtReadiness({ county: "Riverside", chapter: "7" }),
    filingPackage: {
      formsIncluded: [
        "101",
        "106A/B",
        "106C",
        "106D",
        "106E/F",
        "106G",
        "106H",
        "106I",
        "106J",
        "107",
        "122A-1",
        "122A-2",
        "122C-1",
        "122C-2",
        "cert-counsel",
        "3015-1.7",
        "MML",
        "341",
        "3015-1.01 (Ch 13)",
      ],
      pdfGeneration: "metadata_only",
      note: "Petition view + e-file package builder; court PDF fill is next phase",
    },
  });
});

