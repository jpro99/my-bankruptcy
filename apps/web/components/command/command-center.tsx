"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchCommandCenter, type MatterProgress } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-green-500 border-green-600",
  in_progress: "bg-blue-500 border-blue-600 animate-pulse",
  blocked: "bg-gray-300 border-gray-400",
  pending: "bg-white border-gray-300",
};

export function CommandCenter({ matterId }: { matterId: string }) {
  const [progress, setProgress] = useState<MatterProgress | null>(null);
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [caseNumber, setCaseNumber] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommandCenter(matterId);
      setProgress(data.progress);
      setPortalUrl(data.portalUrl);
      setCaseNumber(data.caseNumber);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !progress) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading command center…</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold">
              Command Center
            </p>
            <h1 className="text-3xl font-bold mt-1">{progress.tagline}</h1>
            {caseNumber && (
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Case #{caseNumber}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-5xl font-black text-blue-600">{progress.overallPercent}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {progress.stepsComplete}/{progress.stepsTotal} steps
            </p>
          </div>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700"
            style={{ width: `${progress.overallPercent}%` }}
          />
        </div>

        {progress.nextAction && (
          <Link
            href={progress.nextAction.href}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            → {progress.nextAction.label}
            <span className="text-blue-200 text-sm font-normal">({progress.nextAction.title})</span>
          </Link>
        )}
      </header>

      <div className="grid gap-3">
        {progress.steps.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border-2 transition",
              step.status === "complete" && "bg-green-50 border-green-200",
              step.status === "in_progress" && "bg-blue-50 border-blue-300 shadow-sm",
              step.status === "pending" && "bg-white border-gray-200",
              step.status === "blocked" && "bg-gray-50 border-gray-200 opacity-60"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0",
                STATUS_STYLES[step.status] ?? STATUS_STYLES.pending,
                step.status === "complete" && "text-white",
                step.status === "in_progress" && "text-white"
              )}
            >
              {step.status === "complete" ? "✓" : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{step.description}</p>
            </div>
            {step.actionHref && step.status !== "complete" && (
              <Link
                href={step.actionHref}
                className="text-sm px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 shrink-0"
              >
                {step.actionLabel ?? "Go"}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap text-sm">
        <Link
          href={portalUrl}
          className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
        >
          📱 Client portal link
        </Link>
        <Link
          href={`/matters/${matterId}/cockpit`}
          className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
        >
          Cockpit →
        </Link>
      </div>
    </div>
  );
}
