"use client";

import { useEffect, useState } from "react";
import { StaffHeader } from "@/components/staff/staff-header";
import { PracticePacketWorkspace } from "@/components/filing/practice-packet-workspace";
import { ReliefCopilotSheet } from "@/components/copilot/relief-copilot-sheet";
import "@/styles/staff-chrome.css";
import "@/styles/court-form.css";

export default function PracticeFilingPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <div className="app-container min-h-screen">
      <StaffHeader />
      <div className="py-4">
        <PracticePacketWorkspace matterId={matterId} />
      </div>
      <ReliefCopilotSheet matterId={matterId} phase="forge" />
    </div>
  );
}
