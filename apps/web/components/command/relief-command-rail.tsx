"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { fetchCommandCenter, type MatterProgress } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Slim progress rail — Scout → Forge → Gavel → Continuum (not a separate destination) */
export function ReliefCommandRail({
  matterId,
  activePhase,
}: {
  matterId: string;
  activePhase: "scout" | "forge" | "gavel" | "continuum";
}) {
  const [progress, setProgress] = useState<MatterProgress | null>(null);
  const [filed, setFiled] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommandCenter(matterId);
      setProgress(data.progress);
      setFiled(!!data.caseNumber);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const phases = [
    {
      id: "scout" as const,
      label: BRAND.reliefScout.short,
      full: BRAND.reliefScout.name,
      href: `/matters/${matterId}/scout`,
      done: progress?.steps.find((s) => s.id === "scout")?.status === "complete",
    },
    {
      id: "forge" as const,
      label: BRAND.forge.short,
      full: BRAND.forge.name,
      href: `/matters/${matterId}/forge`,
      done: progress ? progress.overallPercent >= 75 && !filed : false,
    },
    {
      id: "gavel" as const,
      label: "Gavel",
      full: BRAND.gavel.name,
      href: `/matters/${matterId}/forge?section=seal`,
      done: filed,
    },
    {
      id: "continuum" as const,
      label: BRAND.continuum.short,
      full: BRAND.continuum.name,
      href: `/matters/${matterId}/continuum`,
      done: false,
      locked: !filed,
    },
  ];

  if (loading) {
    return (
      <div className="relief-command-rail relief-command-rail--loading">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relief-command-rail">
      <div className="relief-command-rail__label">
        <span className="relief-command-rail__brand">{BRAND.command.name}</span>
        {progress && (
          <span className="relief-command-rail__pct">{progress.overallPercent}%</span>
        )}
      </div>
      <ol className="relief-command-rail__steps">
        {phases.map((phase, i) => {
          const isActive = phase.id === activePhase;
          const isLocked = phase.locked;
          const content = (
            <>
              {phase.done ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <span className="relief-command-rail__dot" />
              )}
              <span className="relief-command-rail__step-label">{phase.label}</span>
            </>
          );
          return (
            <li key={phase.id} className="relief-command-rail__step-wrap">
              {i > 0 && <ChevronRight className="relief-command-rail__chev" aria-hidden />}
              {isLocked ? (
                <span
                  className={cn("relief-command-rail__step", "relief-command-rail__step--locked")}
                  title={`${phase.full} — unlocks after filing`}
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={phase.href}
                  className={cn(
                    "relief-command-rail__step",
                    isActive && "relief-command-rail__step--active",
                    phase.done && "relief-command-rail__step--done"
                  )}
                  title={phase.full}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      {progress?.nextAction && activePhase !== "continuum" && (
        <Link href={progress.nextAction.href} className="relief-command-rail__next">
          Next: {progress.nextAction.label}
        </Link>
      )}
    </div>
  );
}
