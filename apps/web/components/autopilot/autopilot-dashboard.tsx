"use client";

import { useCallback, useEffect, useState } from "react";
import {
  completeAutopilotTask,
  fetchAutopilot,
  runAutopilotAutoAction,
  type AutopilotTask,
  type AutopilotTimeline,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AutopilotDashboardProps {
  matterId: string;
}

const STATUS_COLORS: Record<string, string> = {
  overdue: "border-red-300 bg-red-50",
  due: "border-amber-300 bg-amber-50",
  upcoming: "border-gray-200 bg-white",
  completed: "border-green-200 bg-green-50 opacity-70",
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  normal: "bg-gray-100 text-gray-700",
  low: "bg-gray-50 text-gray-500",
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
    return <p className="text-sm text-[var(--muted-foreground)]">Loading autopilot…</p>;
  }

  if (!filed || !timeline) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <p className="text-4xl">🛫</p>
        <h2 className="text-xl font-semibold">Autopilot activates after filing</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {message ?? "File the petition from the Cockpit God Button to start post-petition deadline tracking."}
        </p>
        <a
          href={`/matters/${matterId}/cockpit`}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Go to Cockpit →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Post-Petition Autopilot</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Case {timeline.caseNumber} · Ch {timeline.chapter} · Filed {timeline.filingDate}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Stat label="Overdue" value={timeline.summary.overdue} danger />
          <Stat label="Due today" value={timeline.summary.due} warn />
          <Stat label="Upcoming" value={timeline.summary.upcoming} />
          <Stat label="Done" value={timeline.summary.completed} ok />
        </div>
      </header>

      {autoResult && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-800 mb-1">Auto-action result</p>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(autoResult, null, 2)}
          </pre>
          <button
            type="button"
            className="mt-2 text-xs text-blue-600 underline"
            onClick={() => setAutoResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {timeline.tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              "border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3",
              STATUS_COLORS[task.status] ?? "bg-white"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                    PRIORITY_BADGE[task.priority]
                  )}
                >
                  {task.priority}
                </span>
                <span className="text-[10px] uppercase text-[var(--muted-foreground)]">
                  {task.category.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">Due {task.dueDate}</span>
              </div>
              <h3 className="font-semibold mt-1">{task.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{task.description}</p>
            </div>
            {task.status !== "completed" && (
              <div className="flex gap-2 shrink-0">
                {task.autoAction && task.autoAction !== "none" && (
                  <button
                    type="button"
                    onClick={() => void handleAutoRun(task)}
                    className="text-xs px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition"
                  >
                    Run auto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleComplete(task.id)}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Complete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
  warn,
  ok,
}: {
  label: string;
  value: number;
  danger?: boolean;
  warn?: boolean;
  ok?: boolean;
}) {
  return (
    <div className="text-center px-3 py-1 rounded-lg bg-[var(--muted)]">
      <p
        className={cn(
          "text-lg font-bold",
          danger && value > 0 && "text-red-600",
          warn && value > 0 && "text-amber-600",
          ok && "text-green-600"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
