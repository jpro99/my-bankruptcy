"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Lock,
  Smartphone,
} from "lucide-react";
import { fetchCommandCenter, type MatterProgress } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const STATUS_CONFIG = {
  complete: {
    icon: CheckCircle2,
    badge: "success" as const,
    ring: "border-emerald-200 bg-emerald-50/50",
    iconClass: "text-emerald-600",
  },
  in_progress: {
    icon: Clock,
    badge: "default" as const,
    ring: "border-indigo-300 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-100",
    iconClass: "text-primary",
  },
  blocked: {
    icon: Lock,
    badge: "secondary" as const,
    ring: "border-border bg-muted/50 opacity-70",
    iconClass: "text-muted-foreground",
  },
  pending: {
    icon: Circle,
    badge: "secondary" as const,
    ring: "border-border bg-card",
    iconClass: "text-muted-foreground",
  },
};

export function CommandCenter({ matterId }: { matterId: string }) {
  const [progress, setProgress] = useState<MatterProgress | null>(null);
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [caseNumber, setCaseNumber] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommandCenter(matterId);
      setProgress(data.progress);
      setPortalUrl(data.portalUrl);
      setCaseNumber(data.caseNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <Card className="max-w-lg border-danger-muted bg-danger-muted/30">
        <CardContent className="p-6 space-y-4">
          <p className="font-semibold text-red-800">Could not load command center</p>
          <p className="text-sm text-red-700/80">{error ?? "Unknown error"}</p>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <header className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <Badge>Command Center</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {progress.tagline}
            </h1>
            {caseNumber && (
              <p className="text-sm text-muted-foreground">Case #{caseNumber}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-5xl font-black text-gradient">
              {progress.overallPercent}%
            </p>
            <p className="text-xs text-muted-foreground">
              {progress.stepsComplete} of {progress.stepsTotal} steps complete
            </p>
          </div>
        </div>

        <Progress value={progress.overallPercent} className="h-2.5" />

        {progress.nextAction && (
          <Button asChild size="lg" className="shadow-glow">
            <Link href={progress.nextAction.href}>
              {progress.nextAction.label}
              <span className="font-normal text-indigo-200">
                — {progress.nextAction.title}
              </span>
              <ArrowRight />
            </Link>
          </Button>
        )}
      </header>

      <div className="grid gap-3">
        {progress.steps.map((step, i) => {
          const config = STATUS_CONFIG[step.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
          const Icon = config.icon;
          return (
            <Card
              key={step.id}
              className={cn("transition-all", config.ring)}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                    step.status === "complete" && "border-emerald-500 bg-emerald-500 text-white",
                    step.status === "in_progress" && "border-primary bg-primary text-white"
                  )}
                >
                  {step.status === "complete" || step.status === "in_progress" ? (
                    <Icon className="size-5" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <Badge variant={config.badge}>{step.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
                {step.actionHref && step.status !== "complete" && (
                  <Button asChild variant="secondary" size="sm" className="shrink-0">
                    <Link href={step.actionHref}>{step.actionLabel ?? "Go"}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button asChild variant="secondary">
          <Link href={portalUrl}>
            <Smartphone className="size-4" />
            Client portal link
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/matters/${matterId}/cockpit`}>
            Open Cockpit
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
