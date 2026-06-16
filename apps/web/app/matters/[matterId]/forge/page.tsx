"use client";

import { useEffect, useState } from "react";
import { ForgeWorkspace } from "@/components/forge/forge-workspace";
import { MatterShell } from "@/components/layout/matter-shell";
import "@/styles/staff-chrome.css";

export default function ForgePage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <MatterShell matterId={matterId}>
      <ForgeWorkspace matterId={matterId} />
    </MatterShell>
  );
}
