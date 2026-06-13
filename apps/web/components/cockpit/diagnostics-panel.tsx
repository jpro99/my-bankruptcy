"use client";

import type { MatterDiagnostics } from "@/lib/types";
import type { ApiDiagnostics } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GodButton } from "@/components/cockpit/god-button";

interface DiagnosticsPanelProps {
  diagnostics: MatterDiagnostics;
  creditSummary?: ApiDiagnostics["creditSummary"] | null;
  pendingCount: number;
  approvedCount: number;
  matterId: string;
}

export function DiagnosticsPanel({
  diagnostics,
  creditSummary,
  pendingCount,
  approvedCount,
  matterId,
}: DiagnosticsPanelProps) {
  return (
    <aside className="w-72 border-l border-[var(--border)] bg-white p-4 space-y-4 overflow-y-auto">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Live Diagnostics
      </h2>

      <div className="space-y-3">
        <DiagnosticItem
          label="Review Progress"
          value={`${approvedCount} approved · ${pendingCount} pending`}
          status="neutral"
        />
        <DiagnosticItem
          label="Missing Fields"
          value={String(diagnostics.missingFields)}
          status={diagnostics.missingFields > 0 ? "warning" : "success"}
        />
        <DiagnosticItem
          label="Exemption Gaps"
          value={String(diagnostics.exemptionGaps)}
          status={diagnostics.exemptionGaps > 0 ? "warning" : "success"}
        />
        <DiagnosticItem
          label="Means Test"
          value={diagnostics.meansTestStatus.toUpperCase()}
          status={diagnostics.meansTestStatus === "pass" ? "success" : "warning"}
        />
        <DiagnosticItem
          label="§707(b) Abuse"
          value={diagnostics.presumptionOfAbuse ? "PRESUMED" : "None"}
          status={diagnostics.presumptionOfAbuse ? "danger" : "success"}
        />
      </div>

      {creditSummary && (
        <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
            Credit → Schedules
          </h3>
          <ScheduleRow label="D (Secured)" count={creditSummary.scheduleD} amount={creditSummary.totalSecured} />
          <ScheduleRow label="E (Priority)" count={creditSummary.scheduleE} amount={creditSummary.totalPriority} />
          <ScheduleRow label="F (Unsecured)" count={creditSummary.scheduleF} amount={creditSummary.totalUnsecured} />
          <ScheduleRow label="G (Executory)" count={creditSummary.scheduleG} />
        </div>
      )}

      <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
          Chapter Recommendation
        </h3>
        <p className="text-2xl font-bold text-[var(--primary)]">
          Chapter {diagnostics.chapterRecommendation}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          {diagnostics.recommendationRationale}
        </p>
      </div>

      <GodButton
        matterId={matterId}
        chapter={diagnostics.chapterRecommendation}
        disabled={pendingCount > 0 && diagnostics.chapterRecommendation !== "review"}
      />

      <a
        href={`/matters/${matterId}/autopilot`}
        className="block w-full py-2 text-center text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition"
      >
        Post-Petition Autopilot →
      </a>

      <a
        href={`/matters/${matterId}/plan`}
        className="block w-full py-2 text-center text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition"
      >
        Chapter 13 Plan Builder →
      </a>
    </aside>
  );
}

function ScheduleRow({
  label,
  count,
  amount,
}: {
  label: string;
  count: number;
  amount?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-medium">
        {count} creditor{count !== 1 ? "s" : ""}
        {amount ? ` · $${amount}` : ""}
      </span>
    </div>
  );
}

function DiagnosticItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "success" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    danger: "text-[var(--danger)]",
    neutral: "text-[var(--foreground)]",
  };
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className={cn("font-medium", colors[status])}>{value}</span>
    </div>
  );
}
