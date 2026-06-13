"use client";

import Link from "next/link";
import { Activity, ArrowRight, Calculator, Plane } from "lucide-react";
import type { MatterDiagnostics } from "@/lib/types";
import type { ApiDiagnostics } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GodButton } from "@/components/cockpit/god-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const total = approvedCount + pendingCount;
  const reviewPct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-muted/30">
      <div className="border-b border-border bg-white px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Live Diagnostics</h2>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Review progress</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{approvedCount} approved</span>
              <span>{pendingCount} pending</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${reviewPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Missing"
            value={String(diagnostics.missingFields)}
            variant={diagnostics.missingFields > 0 ? "warning" : "success"}
          />
          <MetricCard
            label="Exemptions"
            value={String(diagnostics.exemptionGaps)}
            variant={diagnostics.exemptionGaps > 0 ? "warning" : "success"}
          />
          <MetricCard
            label="Means test"
            value={diagnostics.meansTestStatus.toUpperCase()}
            variant={diagnostics.meansTestStatus === "pass" ? "success" : "warning"}
          />
          <MetricCard
            label="§707(b)"
            value={diagnostics.presumptionOfAbuse ? "Abuse" : "Clear"}
            variant={diagnostics.presumptionOfAbuse ? "danger" : "success"}
          />
        </div>

        {creditSummary && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Credit → Schedules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 text-xs">
              <ScheduleRow label="D Secured" count={creditSummary.scheduleD} amount={creditSummary.totalSecured} />
              <ScheduleRow label="E Priority" count={creditSummary.scheduleE} amount={creditSummary.totalPriority} />
              <ScheduleRow label="F Unsecured" count={creditSummary.scheduleF} amount={creditSummary.totalUnsecured} />
              <ScheduleRow label="G Executory" count={creditSummary.scheduleG} />
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20 bg-primary-muted/30">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chapter recommendation
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">
              Ch {diagnostics.chapterRecommendation}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {diagnostics.recommendationRationale}
            </p>
          </CardContent>
        </Card>

        <GodButton
          matterId={matterId}
          chapter={diagnostics.chapterRecommendation}
          disabled={pendingCount > 0 && diagnostics.chapterRecommendation !== "review"}
        />

        <div className="space-y-2">
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/matters/${matterId}/autopilot`}>
              <Plane className="size-4" />
              Autopilot
              <ArrowRight className="ml-auto size-3.5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href={`/matters/${matterId}/plan`}>
              <Calculator className="size-4" />
              Ch 13 Plan Builder
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "success" | "warning" | "danger";
}) {
  const styles = {
    success: "border-emerald-200 bg-success-muted/50 text-emerald-800",
    warning: "border-amber-200 bg-warning-muted/50 text-amber-800",
    danger: "border-red-200 bg-danger-muted/50 text-red-800",
  };
  return (
    <div className={cn("rounded-lg border p-3", styles[variant])}>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
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
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {count} · {amount ? `$${amount}` : "—"}
      </span>
    </div>
  );
}
