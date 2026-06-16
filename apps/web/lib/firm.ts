/** The Law Offices of Edgar P. Lombera — client-facing firm identity */

export const FIRM = {
  name: "The Law Offices of Edgar P. Lombera",
  shortName: "Edgar P. Lombera",
  attorneyName: "Edgar P. Lombera",
  descriptor: "Bankruptcy & debt relief",
  tagline: "Clear counsel through your fresh start",

  address: {
    line1: "2068 Orange Tree Lane, Suite 220",
    cityStateZip: "Redlands, CA 92374",
  },
  phone: process.env.NEXT_PUBLIC_FIRM_PHONE?.trim() || "(909) 915-0181",

  reviews: {
    googleUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL?.trim() || "",
    yelpUrl: process.env.NEXT_PUBLIC_YELP_REVIEW_URL?.trim() || "",
  },

  portal: {
    title: "Secure Client Portal",
    subtitle: "Upload documents, complete counseling, and message your attorney — privately.",
  },

  personalInjury: {
    enabled: true,
    path: "/personal-injury",
    phone: process.env.NEXT_PUBLIC_PI_PHONE?.trim() || "(555) 555-0199",
    subtleLink: "Injured in an accident?",
    subtleHint: "We also handle personal injury matters — discreetly, when you need us.",
  },

  colors: {
    navy: "#1d1d1f",
    navyMid: "#424245",
    gold: "#86868b",
    goldLight: "#d2d2d7",
    cream: "#f5f5f7",
    parchment: "#ffffff",
  },
} as const;

export function firmPortalTitle(clientName?: string) {
  return clientName
    ? `${FIRM.shortName} — ${clientName}'s portal`
    : `${FIRM.name} — Client Portal`;
}
