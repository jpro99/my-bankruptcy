import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/staff-chrome.css";
import "@/styles/field-capture.css";

/** Mobile-first bankruptcy field capture — bookmark or Add to Home Screen. */
export const metadata: Metadata = {
  title: "Field capture — bankruptcy",
  description:
    "Pick a bankruptcy matter, record a consult or call, read the timeline, or schedule calendar events.",
  robots: { index: false, follow: false },
  manifest: "/field-capture-manifest.json",
  appleWebApp: {
    capable: true,
    title: "Field capture",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function FieldCaptureLayout({ children }: { children: ReactNode }) {
  return <div className="field-capture-layout-root">{children}</div>;
}
