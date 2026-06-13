import type { Metadata, Viewport } from "next";
import { BRAND } from "@/lib/brand";
import { PwaRegister } from "@/components/mobile/pwa-register";

export const metadata: Metadata = {
  title: `${BRAND.reliefPocket.name} — ${BRAND.reliefPocket.shortName}`,
  description: BRAND.reliefPocket.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: BRAND.reliefPocket.shortName,
    statusBarStyle: "black-translucent",
  },
  applicationName: BRAND.reliefPocket.shortName,
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-app min-h-[100dvh] bg-background">
      <PwaRegister />
      <div className="mx-auto max-w-lg px-4 py-5 safe-area-pad">{children}</div>
    </div>
  );
}
