import type { Metadata } from "next";
import { FIRM, firmPortalTitle } from "@/lib/firm";

export const metadata: Metadata = {
  title: firmPortalTitle(),
  description: `${FIRM.name} — ${FIRM.portal.subtitle}`,
  applicationName: FIRM.shortName,
  openGraph: {
    title: FIRM.name,
    description: FIRM.portal.subtitle,
    siteName: FIRM.name,
    type: "website",
    images: [{ url: "/icons/lombera-crest.png", width: 1024, height: 1024, alt: FIRM.name }],
  },
  twitter: {
    card: "summary",
    title: FIRM.name,
    description: FIRM.portal.subtitle,
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
