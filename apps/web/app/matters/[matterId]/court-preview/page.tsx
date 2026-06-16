"use client";

import { useEffect, useState } from "react";
import { CourtPacketPreview } from "@/components/filing/court-packet-preview";
import { MatterShell } from "@/components/layout/matter-shell";
import "@/styles/staff-chrome.css";
import "@/styles/court-form.css";

export default function CourtPreviewPage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <MatterShell matterId={matterId}>
      <CourtPacketPreview matterId={matterId} layout="fullscreen" />
    </MatterShell>
  );
}
