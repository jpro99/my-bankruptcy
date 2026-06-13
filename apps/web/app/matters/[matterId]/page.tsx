"use client";

import { Suspense, useEffect, useState } from "react";
import { MatterPhaseRedirect } from "@/components/matter/matter-phase-redirect";
import { StaffHeader } from "@/components/staff/staff-header";
import "@/styles/staff-chrome.css";

export default function MatterPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <div className="app-container">
      <StaffHeader />
      <Suspense fallback={<p>Loading…</p>}>
        <MatterPhaseRedirect matterId={matterId} />
      </Suspense>
    </div>
  );
}
