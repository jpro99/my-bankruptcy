"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plane,
  Zap,
} from "lucide-react";
import {
  completeAutopilotTask,
  fetchAutopilot,
  runAutopilotAutoAction,
  type AutopilotTask,
  type AutopilotTimeline,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AutopilotDashboardProps {
  matterId: string;
}

const STATUS_STYLES: Record<string, string> = {
  overdue: "border-red-300 bg-danger-muted/40",
  due: "border-amber-300 bg-warning-muted/40",
  upcoming: "border-border bg-card",
  completed: "border-emerald-200 bg-success-muted/30 opacity-80",
};

export function AutopilotDashboard({ matterId }: AutopilotDashboardProps) {
  const [timeline, setTimeline] = useState<AutopilotTimeline | null>(null);
  const [filed, setFiled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoResult, setAutoResult] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAutopilot(matterId);
      setFiled(data.filed);
      setTimeline(data.timeline);
      setMessage(data.message ?? null);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComplete = async (taskId: string) => {
    const res = await completeAutopilotTask(matterId, taskId);
    setTimeline(res.timeline);
  };

  const handleAutoRun = async (task: AutopilotTask) => {
    const res = await runAutopilotAutoAction(matterId, task.id);
    setAutoResult(res.autoActionResult);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!filed || !timeline) {
    return (
      <Card className="mx-auto max-w-lg border-dashed">
        <CardContent className="space-y-5 p-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-muted">
            <Plane className="size-8 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold">{BRAND.continuum.name} unlocks after filing</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {message ??
              `Strike ${BRAND.gavel.name} from ${BRAND.forge.name} to start the post-petition path.`}
          </p>
          <Button asChild>
            <Link href={`/matters/${matterId}/forge`}>Go to {BRAND.forge.name}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2">{BRAND.continuum.name}</Badge>
          <h1 className="font-display text-3xl font-bold">{BRAND.continuum.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Case {timeline.caseNumber} · Ch {timeline.chapter} · Filed {timeline.filingDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Stat label="Overdue" value={timeline.summary.overdue} variant="danger" />
          <Stat label="Due" value={timeline.summary.due} variant="warning" />
          <Stat label="Upcoming" value={timeline.summary.upcoming} />
          <Stat label="Done" value={timeline.summary.completed} variant="success" />
        </div>
      </header>

      {autoResult && (
        <Card className="border-primary/20 bg-primary-muted/30">
          <CardContent className="p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Zap className="size-4 text-primary" />
              Auto-action result
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(autoResult, null, 2)}
            </pre>
            <Button variant="link" size="sm" className="mt-2 h-auto p-0" onClick={() => setAutoResult(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {timeline.tasks.map((task) => (
          <li key={task.id}>
            <Card className={cn("transition", STATUS_STYLES[task.status] ?? "bg-card")}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        task.priority === "critical"
                          ? "danger"
                          : task.priority === "high"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.category.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      Due {task.dueDate}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{task.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
                </div>
                {task.status !== "completed" && (
                  <div className="flex shrink-0 gap-2">
                    {task.autoAction && task.autoAction !== "none" && (
                      <Button variant="secondary" size="sm" onClick={() => void handleAutoRun(task)}>
                        <Zap className="size-3.5" />
                        Run auto
                      </Button>
                    )}
                    <Button variant="success" size="sm" onClick={() => void handleComplete(task.id)}>
                      <CheckCircle2 className="size-3.5" />
                      Complete
                    </Button>
                  </div>
                )}
                {task.status === "completed" && (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "danger" | "warning" | "success";
}) {
  return (
    <div className="min-w-[72px] rounded-xl border border-border bg-card px-3 py-2 text-center">
      <p
        className={cn(
          "font-display text-xl font-bold",
          variant === "danger" && value > 0 && "text-danger",
          variant === "warning" && value > 0 && "text-warning",
          variant === "success" && "text-success"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
