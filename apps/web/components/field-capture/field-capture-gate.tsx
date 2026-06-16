"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import FieldCaptureClient from "@/components/field-capture/field-capture-client";
import { useIsMobileClient } from "@/lib/is-mobile-client";

export function FieldCaptureGate() {
  const mobile = useIsMobileClient();
  const searchParams = useSearchParams();
  const force = searchParams.get("force") === "1";

  if (mobile || force) {
    return <FieldCaptureClient />;
  }

  return (
    <div className="field-capture-desktop-gate">
      <div className="field-capture-desktop-gate__card">
        <Smartphone className="field-capture-desktop-gate__icon" aria-hidden />
        <h1>Field capture — phones only</h1>
        <p>
          Open this page on your cell phone. Add to Home Screen for a small side app — record
          consults, read timeline, send portal links.
        </p>
        <p className="field-capture-desktop-gate__url">
          On your phone: <strong>{typeof window !== "undefined" ? window.location.origin : ""}/field-capture</strong>
        </p>
        <div className="field-capture-desktop-gate__actions">
          <Link href="/matters" className="app-btn app-btn--primary">
            Back to matters
          </Link>
          <Link href="/field-capture?force=1" className="app-btn app-btn--tonal">
            Preview anyway
          </Link>
        </div>
      </div>
    </div>
  );
}
