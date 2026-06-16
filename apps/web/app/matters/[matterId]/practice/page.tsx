"use client";

import { useEffect, useState } from "react";
import { PracticePacketWorkspace } from "@/components/filing/practice-packet-workspace";
import { MatterShell } from "@/components/layout/matter-shell";
import "@/styles/staff-chrome.css";
import "@/styles/court-form.css";

export default function PracticeFilingPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <MatterShell matterId={matterId}>
      <PracticePacketWorkspace matterId={matterId} />
    </MatterShell>
  );
}
