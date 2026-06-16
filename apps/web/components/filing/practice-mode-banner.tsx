"use client";

import { AlertTriangle } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function PracticeModeBanner({
  efileMode,
  liveFilingBlocked,
  compact,
  className,
}: {
  efileMode?: "sandbox" | "live";
  liveFilingBlocked?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "practice-mode-banner",
        compact && "practice-mode-banner--compact",
        className
      )}
      role="status"
    >
      <AlertTriangle className="practice-mode-banner__icon" aria-hidden />
      <div className="practice-mode-banner__text">
        <p className="practice-mode-banner__title">{BRAND.practiceMode.banner}</p>
        {!compact && (
          <p className="practice-mode-banner__sub">
            {BRAND.practiceMode.description} E-file:{" "}
            <strong>{efileMode === "live" ? "live configured" : "sandbox"}</strong>
            {liveFilingBlocked ? " — live filing blocked in practice workspace." : "."}
          </p>
        )}
      </div>
    </div>
  );
}
