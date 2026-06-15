import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { FIRM } from "@/lib/firm";
import "./globals.css";
import "@/styles/firm-brand.css";
import { Providers } from "./providers";
import { ApiStatusBanner } from "@/components/layout/api-status-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${FIRM.name} — Bankruptcy Practice`,
  description: `${FIRM.tagline}. Secure client portal, document intake, and case management.`,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true },
  applicationName: FIRM.shortName,
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfcf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          <ApiStatusBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
