/** My Bankruptcy — product vocabulary (no aviation metaphors) */

export const BRAND = {
  name: "My Bankruptcy",
  tagline: "The fastest relief an attorney will ever file",
  shortTag: "Forged for California bankruptcy",

  /** Relief Command — matter mission control */
  command: {
    id: "command",
    name: "Relief Command",
    short: "Command",
    description: "One screen. Every step. Zero guesswork.",
  },

  /** The Forge — approve-only petition workspace */
  forge: {
    id: "forge",
    name: "The Forge",
    short: "Forge",
    description: "Where AI drafts become court-ready petitions.",
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
    name: "Client Vault",
    description: "Encrypted magic link — documents & required courses",
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
