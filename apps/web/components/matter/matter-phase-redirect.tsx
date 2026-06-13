"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCommandCenter } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

/** Route each matter to Scout → Forge → Continuum */
export function MatterPhaseRedirect({ matterId }: { matterId: string }) {
  const router = useRouter();

  useEffect(() => {
    void fetchCommandCenter(matterId)
      .then((data) => {
        if (data.caseNumber) {
          router.replace(`/matters/${matterId}/continuum`);
          return;
        }
        const scoutDone =
          data.progress.steps.find((s) => s.id === "scout")?.status === "complete";
        if (!scoutDone) {
          router.replace(`/matters/${matterId}/scout`);
          return;
        }
        router.replace(`/matters/${matterId}/forge`);
      })
      .catch(() => router.replace(`/matters/${matterId}/scout`));
  }, [matterId, router]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening matter…</p>
    </div>
  );
}
