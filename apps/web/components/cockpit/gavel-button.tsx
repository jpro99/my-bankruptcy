"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Gavel,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { fetchPreflight, filePetition, type PreflightReport } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface GavelButtonProps {
  matterId: string;
  chapter: "7" | "13" | "review";
  disabled?: boolean;
}

/** The Gavel — seal check then e-file */
export function GavelButton({ matterId, chapter, disabled }: GavelButtonProps) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [filing, setFiling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    caseNumber: string;
    message: string;
    autopilotTaskCount?: number;
  } | null>(null);

  const chapterLabel = chapter === "review" ? "7" : chapter;

  const runSealCheck = async () => {
    setOpen(true);
    setResult(null);
    setReport(null);
    setLoading(true);
    try {
      const data = await fetchPreflight(matterId);
      setReport(data.report);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async () => {
    setFiling(true);
    try {
      const res = await filePetition(matterId);
      setResult({
        caseNumber: res.caseNumber,
        message: res.message,
        autopilotTaskCount: res.autopilot?.taskCount,
      });
    } catch {
      setResult({ caseNumber: "", message: "Seal Check blocked filing — resolve errors first." });
    } finally {
      setFiling(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="lg"
        className="w-full shadow-elevated"
        onClick={() => void runSealCheck()}
        disabled={disabled}
      >
        <Gavel className="size-4" />
        {BRAND.gavel.action} — Ch {chapterLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="max-h-[85vh] w-full max-w-lg overflow-hidden shadow-elevated animate-fade-in">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold">{BRAND.sealCheck.name}</h2>
                <p className="text-xs text-muted-foreground">{BRAND.sealCheck.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <CardContent className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
              {result ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "rounded-xl border p-4",
                      result.caseNumber
                        ? "border-emerald-200 bg-success-muted"
                        : "border-red-200 bg-danger-muted"
                    )}
                  >
                    <p className="flex items-center gap-2 font-semibold">
                      {result.caseNumber ? (
                        <>
                          <CheckCircle2 className="size-5 text-success" />
                          Filed — Case #{result.caseNumber}
                        </>
                      ) : (
                        <>
                          <XCircle className="size-5 text-danger" />
                          Filing blocked
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
                    {result.autopilotTaskCount !== undefined && (
                      <p className="mt-2 text-xs font-medium text-success">
                        {BRAND.continuum.name} activated — {result.autopilotTaskCount} milestones
                      </p>
                    )}
                  </div>
                  {result.caseNumber && (
                    <Button asChild className="w-full">
                      <Link href={`/matters/${matterId}/continuum`} onClick={() => setOpen(false)}>
                        Open {BRAND.continuum.name}
                      </Link>
                    </Button>
                  )}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Running Seal Check…</p>
                </div>
              ) : report ? (
                <>
                  <div
                    className={cn(
                      "rounded-xl p-4 text-center",
                      report.readyToFile ? "bg-success-muted" : "bg-danger-muted"
                    )}
                  >
                    <p className="font-display text-lg font-bold">
                      {report.readyToFile ? "Seal verified" : "Not ready"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.passed}/{report.totalRules} rules passed
                      {report.errors > 0 && ` · ${report.errors} error(s)`}
                      {report.warnings > 0 && ` · ${report.warnings} warning(s)`}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {report.results.map((r) => (
                      <li
                        key={r.ruleId}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 text-sm",
                          r.passed
                            ? "border-border bg-muted/30"
                            : r.severity === "error"
                              ? "border-red-200 bg-danger-muted/50"
                              : "border-amber-200 bg-warning-muted/50"
                        )}
                      >
                        {r.passed ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        ) : r.severity === "error" ? (
                          <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                        ) : (
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {r.ruleId}
                            </Badge>
                            {r.formReference && (
                              <span className="text-[10px] text-muted-foreground">
                                Form {r.formReference}
                              </span>
                            )}
                          </div>
                          <p className="mt-1">{r.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {report.readyToFile && (
                    <Button
                      variant="danger"
                      size="lg"
                      className="w-full"
                      onClick={() => void handleFile()}
                      disabled={filing}
                    >
                      {filing ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Submitting to CM/ECF…
                        </>
                      ) : (
                        <>
                          <Gavel />
                          {BRAND.gavel.action}
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/** @deprecated use GavelButton */
export const GodButton = GavelButton;
