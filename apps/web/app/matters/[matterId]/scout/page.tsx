"use client";

import { Suspense, useEffect, useState } from "react";
import { ReliefScoutPanel } from "@/components/scout/relief-scout-panel";
import { ReliefCommandRail } from "@/components/command/relief-command-rail";
import { MatterShell } from "@/components/layout/matter-shell";
import "@/styles/staff-chrome.css";

function ScoutPageInner({ matterId }: { matterId: string }) {
  return (
    <>
      <ReliefCommandRail matterId={matterId} activePhase="scout" />
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
    <MatterShell matterId={matterId}>
      <Suspense fallback={<p>Loading scout…</p>}>
        <ScoutPageInner matterId={matterId} />
      </Suspense>
    </MatterShell>
  );
}
