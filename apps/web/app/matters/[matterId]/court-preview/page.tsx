"use client";

import { useEffect, useState } from "react";
import { StaffHeader } from "@/components/staff/staff-header";
import { CourtPacketPreview } from "@/components/filing/court-packet-preview";
import "@/styles/staff-chrome.css";

export default function CourtPreviewPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <div className="app-container min-h-screen">
      <StaffHeader />
      <div className="py-4">
        <CourtPacketPreview matterId={matterId} layout="fullscreen" />
      </div>
    </div>
  );
}
