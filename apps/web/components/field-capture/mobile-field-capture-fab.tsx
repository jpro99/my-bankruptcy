"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { usePathname } from "next/navigation";
import { useIsMobileClient } from "@/lib/is-mobile-client";

/** Floating phone side-app entry — Demand Generator Pro pattern */
export function MobileFieldCaptureFab() {
  const mobile = useIsMobileClient();
  const pathname = usePathname();

  if (!mobile || pathname.startsWith("/field-capture") || pathname.startsWith("/portal")) {
    return null;
  }

  return (
    <Link
      href="/field-capture"
      className="mobile-field-capture-fab"
      aria-label="Open field capture on phone"
      title="Field capture"
    >
      <Mic className="size-5" aria-hidden />
      <span>Field</span>
    </Link>
  );
}
