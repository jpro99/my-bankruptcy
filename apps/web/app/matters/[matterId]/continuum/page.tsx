"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { AutopilotDashboard } from "@/components/autopilot/autopilot-dashboard";
import { ReliefCommandRail } from "@/components/command/relief-command-rail";
import { MatterCalendarPanel } from "@/components/workflow/matter-calendar-panel";
import { StaffHeader } from "@/components/staff/staff-header";
import { BRAND } from "@/lib/brand";
import "@/styles/staff-chrome.css";

export default function ContinuumPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <div className="app-container">
      <StaffHeader />
      <ReliefCommandRail matterId={matterId} activePhase="continuum" />
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/matters/${matterId}/forge`} className="app-btn app-btn--tonal">
          ← {BRAND.forge.name}
        </Link>
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <AutopilotDashboard matterId={matterId} />
      </Suspense>
      <section style={{ marginTop: "2rem" }}>
        <MatterCalendarPanel matterId={matterId} />
      </section>
    </div>
  );
}
