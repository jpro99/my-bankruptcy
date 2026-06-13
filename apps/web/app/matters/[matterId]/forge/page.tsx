"use client";

import { Suspense, useEffect, useState } from "react";
import { ForgeWorkspace } from "@/components/forge/forge-workspace";

export default function ForgePage({ params }: { params: Promise<{ matterId: string }> }) {
  const [matterId, setMatterId] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setMatterId(p.matterId));
  }, [params]);

  if (!matterId) return null;

  return (
    <Suspense fallback={<p>Loading forge…</p>}>
      <ForgeWorkspace matterId={matterId} />
    </Suspense>
  );
}
