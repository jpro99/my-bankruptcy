"use client";

import { Suspense, useEffect, useState } from "react";
import { fetchCommandCenter } from "@/lib/api-client";
import { MatterWorkspace } from "@/components/staff/matter-workspace";
import { StaffHeader } from "@/components/staff/staff-header";
import "@/styles/staff-chrome.css";

function MatterWorkspaceLoader({ matterId }: { matterId: string }) {
  const [debtorName, setDebtorName] = useState("Loading…");

  useEffect(() => {
    void fetchCommandCenter(matterId).then((d) => setDebtorName(d.progress.debtorDisplayName));
  }, [matterId]);

  return <MatterWorkspace matterId={matterId} debtorName={debtorName} />;
}

export default function MatterPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <div className="app-container">
      <StaffHeader />
      <Suspense fallback={<p>Loading matter…</p>}>
        <MatterWorkspaceLoader matterId={matterId} />
      </Suspense>
    </div>
  );
}
