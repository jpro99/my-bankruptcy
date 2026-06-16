/** Practice vocabulary — firm identity lives in lib/firm.ts */



import { FIRM } from "./firm";



export const BRAND = {

  name: FIRM.name,

  tagline: FIRM.tagline,

  shortTag: "Bankruptcy & debt relief",



  /** Case progress rail — Consult → Prep → File → Post-Filing */

  command: {

    id: "command",

    name: "Case Progress",

    short: "Progress",

    description: "Where the case stands — consult through discharge.",

  },



  /** Petition Prep — documents, credit, schedules, review before filing */

  forge: {

    id: "forge",

    name: "Petition Prep",

    short: "Prep",

    tagline: "Build the petition — documents, credit, schedules, review, and filing packet.",

    description: "Everything after initial consult until you file the petition.",

    legacyPath: "cockpit",

  },



  /** Post-filing — 341 through discharge */

  continuum: {

    id: "continuum",

    name: "Post-Filing",

    short: "Post-Filing",

    description: "341 meeting through discharge — deadlines and follow-up.",

    legacyPath: "autopilot",

  },



  /** E-file — submit petition after final sign-off */

  gavel: {

    name: "E-File",

    short: "File",

    action: "File Petition",

    clearedLabel: "Cleared to file petition",

    description: "Final sign-off complete. Submit the petition to the court.",

  },



  sealCheck: {

    name: "Final Sign-Off",

    description: "Document QA, numbers review, and attorney approval before filing",

  },



  trustLedger: {

    name: "Fees & Trust",

    short: "Fees",

    description: "Flat fees, trust accounting, and payment receipts",

  },



  counseling: {

    name: "Credit Counseling",

    description: "BAPCPA Course 1 & 2 — provider link, relay, or client upload",

    tiers: {

      gold: {

        id: "gold",

        label: "Direct — provider feed",

        description: "Provider partnership — certificate lands in the case automatically",

      },

      relay: {

        id: "relay",

        label: "Relay — secure email",

        description: "Secure intake address — certificate attached when it arrives",

      },

      vault: {

        id: "vault",

        label: "Client upload",

        description: "Client completes the course and uploads the certificate PDF",

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



  clientPortal: {

    name: "Client Portal",

    short: "Portal",

    linkLabel: "Client Portal link",

    inviteAction: "Send portal link",

    copyAction: "Copy Client Portal link",

    description: "Secure link for client document uploads and messages",

  },



  /** Initial consult — means test and take-case before petition prep */

  reliefScout: {

    name: "Initial Consult",

    short: "Consult",

    description: "Means test, expenses, take the case — then open Petition Prep.",

  },



  benchNotes: {

    name: "Matter Notes",

    action: "Add a note",

    description: "Voice or text notes — saved to the matter file",

  },



  dossier: {

    name: "Client file",

    description: "Documents from the client portal and attorney uploads",

  },



  documentDrop: {

    name: "File Upload",

    description: "Upload from your computer — IDs, paystubs, tax returns",

  },



  /** Apply uploaded docs to petition fields */

  forgeSync: {

    name: "Apply to Petition",

    action: "Apply to petition",

    description: "Push IDs, paystubs, and uploads into the bankruptcy forms",

  },



  copilot: {

    name: "Case Assistant",

    short: "Assistant",

    description: "Ask about next steps, schedules, filing, or discharge",

  },



  reliefPocket: {

    name: "Mobile App",

    shortName: "Matters",

    tagline: "Bankruptcy matters on your phone",

    description: "Install to home screen — matters, notes, and calendar on the go",

  },



  /** Attorney sandbox — full packet walkthrough without live court filing */

  practiceMode: {

    name: "Practice Filing",

    short: "Practice",

    banner: "Practice mode — sandbox only, not filed with court",

    description:

      "Walk every court paper, edit fields, print, and sandbox e-file before going live.",

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


