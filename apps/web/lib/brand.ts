/** Practice vocabulary — firm identity lives in lib/firm.ts */

import { FIRM } from "./firm";

export const BRAND = {
  name: FIRM.name,
  tagline: FIRM.tagline,
  shortTag: "Bankruptcy & debt relief",

  /** Relief Command — progress rail across Scout → Forge → Gavel → Continuum */
  command: {
    id: "command",
    name: "Relief Command",
    short: "Command",
    description: "Where you are in the pipeline — not a separate workspace.",
  },

  /** The Forge — all pre-filing attorney work in one place */
  forge: {
    id: "forge",
    name: "The Forge",
    short: "Forge",
    tagline: "Where the bankruptcy is built — documents, credit, schedules, petition, filing.",
    description: "Everything after Relief Scout lives here until you Strike The Gavel.",
    legacyPath: "cockpit",
  },

  /** Continuum — post-filing through discharge */
  continuum: {
    id: "continuum",
    name: "Continuum",
    short: "Continuum",
    description: "341 to discharge — nothing falls through the cracks.",
    legacyPath: "autopilot",
  },

  /** The Gavel — one-click e-file after seal check */
  gavel: {
    name: "The Gavel",
    action: "Strike The Gavel",
    description: "Seal verified. One motion files the petition.",
  },

  sealCheck: {
    name: "Seal Check",
    description: "247-rule petition verification before filing",
  },

  trustLedger: {
    name: "Trust Ledger",
    short: "Fees & Trust",
    description: "Flat fees, trust accounting, instant receipts",
  },

  counseling: {
    name: "Counseling Bridge",
    description: "BAPCPA courses — link, relay, or vault",
    tiers: {
      gold: {
        id: "gold",
        label: "Gold — Direct",
        description: "Provider partnership — certificate lands in the case automatically",
      },
      relay: {
        id: "relay",
        label: "Relay — Smart Email",
        description: "Secure intake address — we attach the cert when it arrives",
      },
      vault: {
        id: "vault",
        label: "Vault — Client Upload",
        description: "Client completes anywhere, uploads PDF to their secure portal",
      },
    },
    providers: {
      debtorcc: { name: "DebtorCC.org", url: "https://debtorcc.org" },
      bkcert: { name: "BKCert.com (DECAF)", url: "https://www.bkcert.com" },
      advantagecc: { name: "AdvantageCC.org", url: "https://www.advantagecc.org" },
      creditorg: { name: "Credit.org", url: "https://www.credit.org/bankruptcy/" },
    },
  },

  portal: {
    name: FIRM.portal.title,
    description: FIRM.portal.subtitle,
  },

  /** Relief Scout — first consult gate before The Forge */
  reliefScout: {
    name: "Relief Scout",
    short: "Scout",
    description: "First consult walkthrough — means test, take the case, then enter The Forge.",
  },

  /** Bench Notes — attorney voice/text notes from phone */
  benchNotes: {
    name: "Bench Notes",
    action: "Leave a note",
    description: "Tap, speak, done — lands in the matter file instantly",
  },

  /** Client file — documents from their vault link & attorney */
  dossier: {
    name: "Client file",
    description: "Documents from their Client Vault link — always this matter, never another file",
  },

  /** Forge Sync — push collected intake into the petition */
  forgeSync: {
    name: "Forge Sync",
    action: "Sync to petition",
    description: "One button — IDs, paystubs, uploads fill the bankruptcy",
  },

  /** Relief Co-pilot — AI assistant on every matter step */
  copilot: {
    name: "Relief Co-pilot",
    short: "Co-pilot",
    description: "Ask about next steps, fields, filing, or discharge — context follows you",
  },

  /** Relief Pocket — installable Android / phone attorney app */
  reliefPocket: {
    name: "Relief Pocket",
    shortName: "Matters",
    tagline: "Bankruptcy on your phone",
    description: "Install to home screen — pick a matter, note, calendar, Gmail",
  },
} as const;

export type CounselingTier = keyof typeof BRAND.counseling.tiers;
export type CounselingProvider = keyof typeof BRAND.counseling.providers;

export function matterPath(matterId: string, section: keyof Pick<typeof BRAND, "command" | "forge" | "continuum">) {
  const paths = {
    command: "command",
    forge: "forge",
    continuum: "continuum",
  };
  return `/matters/${matterId}/${paths[section]}`;
}
