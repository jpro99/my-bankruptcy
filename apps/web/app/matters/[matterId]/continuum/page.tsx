"use client";

import { Suspense, useEffect, useState } from "react";
import { AutopilotDashboard } from "@/components/autopilot/autopilot-dashboard";
import { ReliefCommandRail } from "@/components/command/relief-command-rail";
import { MatterCalendarPanel } from "@/components/workflow/matter-calendar-panel";
import { MatterShell } from "@/components/layout/matter-shell";
import "@/styles/staff-chrome.css";

export default function ContinuumPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <MatterShell matterId={matterId}>
      <ReliefCommandRail matterId={matterId} activePhase="continuum" />
      <Suspense fallback={<p>Loading…</p>}>
        <AutopilotDashboard matterId={matterId} />
      </Suspense>
      <section style={{ marginTop: "2rem" }}>
        <MatterCalendarPanel matterId={matterId} />
      </section>
    </MatterShell>
  );
}
