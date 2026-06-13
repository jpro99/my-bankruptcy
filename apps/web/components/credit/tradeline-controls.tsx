"use client";

import { Copy, Loader2 } from "lucide-react";
import type { TradelineReviewEntry } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCHEDULES = ["D", "E", "F", "G"] as const;

interface TradelineControlsProps {
  entry: Pick<
    TradelineReviewEntry,
    "id" | "schedule" | "isDuplicate" | "isManual" | "duplicateOfName" | "included"
  >;
  duplicateOptions: { id: string; creditorName: string }[];
  saving?: boolean;
  compact?: boolean;
  onScheduleChange: (schedule: "D" | "E" | "F" | "G") => void;
  onMarkDuplicate: (isDuplicate: boolean, duplicateOfId?: string) => void;
}

export function TradelineControls({
  entry,
  duplicateOptions,
  saving,
  compact,
  onScheduleChange,
  onMarkDuplicate,
}: TradelineControlsProps) {
  const others = duplicateOptions.filter((o) => o.id !== entry.id);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "text-xs")}>
      {entry.isManual && (
        <Badge variant="default" className="text-[10px] uppercase">
          Not on credit
        </Badge>
      )}
      {entry.isDuplicate && (
        <Badge variant="outline" className="border-amber-300 text-amber-900">
          Duplicate{entry.duplicateOfName ? ` of ${entry.duplicateOfName}` : ""}
        </Badge>
      )}

      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">Move to</span>
        <select
          value={entry.schedule}
          disabled={saving || entry.isDuplicate}
          onChange={(e) => onScheduleChange(e.target.value as "D" | "E" | "F" | "G")}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground"
        >
          {SCHEDULES.map((s) => (
            <option key={s} value={s}>
              Schedule {s}
            </option>
          ))}
        </select>
      </label>

      {!entry.isDuplicate ? (
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-muted-foreground"
            disabled={saving || others.length === 0}
            onClick={() => {
              const first = others[0];
              if (first) onMarkDuplicate(true, first.id);
            }}
            title={others.length === 0 ? "No other tradelines to match" : "Mark as duplicate"}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            Mark duplicate
          </Button>
          {others.length > 1 && (
            <select
              className="h-8 max-w-[140px] rounded-md border border-input bg-background px-1 text-xs"
              defaultValue=""
              disabled={saving}
              onChange={(e) => {
                if (e.target.value) onMarkDuplicate(true, e.target.value);
              }}
            >
              <option value="">Duplicate of…</option>
              {others.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.creditorName}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8"
          disabled={saving}
          onClick={() => onMarkDuplicate(false)}
        >
          Clear duplicate
        </Button>
      )}
    </div>
  );
}
