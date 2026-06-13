/** The Law Offices of Edgar Lombera — client-facing firm identity */

export const FIRM = {
  name: "The Law Offices of Edgar Lombera",
  shortName: "Edgar Lombera",
  attorneyName: "Edgar Lombera",
  descriptor: "Bankruptcy & debt relief",
  tagline: "Counsel you can trust through your fresh start",

  portal: {
    title: "Secure Client Portal",
    subtitle: "Upload documents, complete counseling, and message your attorney — privately.",
  },

  /** Subtle PI cross-sell — same firm, not a billboard */
  personalInjury: {
    enabled: true,
    path: "/personal-injury",
    phone: process.env.NEXT_PUBLIC_PI_PHONE?.trim() || "(555) 555-0199",
    subtleLink: "Injured in an accident?",
    subtleHint: "We also handle personal injury matters — discreetly, when you need us.",
  },

  colors: {
    navy: "#0f1c2e",
    navyMid: "#1a2744",
    gold: "#b8975a",
    goldLight: "#d4bc8a",
    cream: "#faf9f7",
    parchment: "#f3f1ec",
  },
} as const;

export function firmPortalTitle(clientName?: string) {
  return clientName
    ? `${FIRM.shortName} — ${clientName}'s portal`
    : `${FIRM.name} — Client Portal`;
}
