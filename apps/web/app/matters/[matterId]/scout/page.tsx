"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ReliefScoutPanel } from "@/components/scout/relief-scout-panel";
import { ReliefCommandRail } from "@/components/command/relief-command-rail";
import { StaffHeader } from "@/components/staff/staff-header";
import { BRAND } from "@/lib/brand";
import "@/styles/staff-chrome.css";

function ScoutPageInner({ matterId }: { matterId: string }) {
  return (
    <>
      <ReliefCommandRail matterId={matterId} activePhase="scout" />
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/matters" className="app-btn app-btn--tonal">
          ← All Matters
        </Link>
      </div>
      <ReliefScoutPanel matterId={matterId} />
    </>
  );
}

export default function ScoutPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <div className="app-container">
      <StaffHeader />
      <p className="text-xs text-muted-foreground mb-2">{BRAND.reliefScout.description}</p>
      <Suspense fallback={<p>Loading scout…</p>}>
        <ScoutPageInner matterId={matterId} />
      </Suspense>
    </div>
  );
}
