"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Plus, Scale, Trash2, XCircle } from "lucide-react";
import {
  addManualCreditor,
  fetchCreditReview,
  patchTradeline,
  pullCredit,
  type ManualCreditorInput,
  type TradelineReviewEntry,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddCreditorModal } from "./add-creditor-modal";
import { TradelineControls } from "./tradeline-controls";

export function CreditReviewPanel({ matterId }: { matterId: string }) {
  const [entries, setEntries] = useState<TradelineReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveLimited, setSaveLimited] = useState(false);
  const [showAddCreditor, setShowAddCreditor] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCreditReview(matterId);
      setEntries(data.entries);
      setSaveLimited(data.reviewApiAvailable === false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load credit review");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePull = async () => {
    setPulling(true);
    setError(null);
    try {
      await pullCredit(matterId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Credit pull failed");
    } finally {
      setPulling(false);
    }
  };

  const applyPatch = async (
    entry: TradelineReviewEntry,
    patch: Parameters<typeof patchTradeline>[2]
  ) => {
    if (saveLimited) {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== entry.id) return e;
          const next = { ...e, ...patch };
          if (patch.isDuplicate) next.included = false;
          if (patch.included === true) next.isDuplicate = false;
          return next;
        })
      );
      return;
    }
    setSavingId(entry.id);
    try {
      const res = await patchTradeline(matterId, entry.id, patch);
      setEntries(res.entries);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save — try again after API redeploys"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleAddCreditor = async (input: ManualCreditorInput) => {
    if (saveLimited) {
      setError("Add creditor requires API — redeploy in progress");
      return;
    }
    const res = await addManualCreditor(matterId, input);
    setEntries(res.entries);
  };

  const toggleIncluded = (entry: TradelineReviewEntry, included: boolean) =>
    void applyPatch(entry, { included });

  const duplicateOptions = entries.map((e) => ({ id: e.id, creditorName: e.creditorName }));
  const includedCount = entries.filter((e) => e.included && !e.isDuplicate).length;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="mb-2">Tri-Merge Credit</Badge>
          <h1 className="font-display text-3xl font-bold">Credit Report Review</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Include or exclude each line, move to the correct schedule (D/E/F/G), mark duplicates,
            or add creditors missing from the credit report.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handlePull()} disabled={pulling}>
            {pulling ? <Loader2 className="animate-spin" /> : "Pull tri-merge credit"}
          </Button>
          <Button variant="secondary" onClick={() => setShowAddCreditor(true)}>
            <Plus className="size-4" />
            Add creditor
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/matters/${matterId}/schedules`}>View schedules</Link>
          </Button>
        </div>
      </header>

      {saveLimited && entries.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-warning-muted px-4 py-3 text-sm text-amber-900">
          API update deploying — you can review lines now. Full controls save once Railway finishes
          redeploying.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger-muted px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-12 text-center text-muted-foreground">
            <p>
              No credit report yet — click <strong>Pull tri-merge credit</strong>, or add a creditor
              not on the report.
            </p>
            <Button variant="secondary" onClick={() => setShowAddCreditor(true)}>
              <Plus className="size-4" />
              Add creditor not on credit report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="success">{includedCount} on petition schedules</Badge>
            <Badge variant="secondary">
              {entries.filter((e) => !e.included || e.isDuplicate).length} excluded / duplicate
            </Badge>
            <Badge variant="outline">
              {entries.filter((e) => e.isManual).length} manual (not on credit)
            </Badge>
          </div>

          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card
                  className={cn(
                    "transition",
                    (!entry.included || entry.isDuplicate) && "opacity-60",
                    entry.advice.recommendation === "exclude" &&
                      entry.included &&
                      !entry.isDuplicate &&
                      "border-amber-200"
                  )}
                >
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <label className="flex shrink-0 cursor-pointer items-center gap-3 pt-1">
                        <input
                          type="checkbox"
                          className="size-5 rounded border-border accent-primary"
                          checked={entry.included && !entry.isDuplicate}
                          disabled={savingId === entry.id || entry.isDuplicate}
                          onChange={(e) => void toggleIncluded(entry, e.target.checked)}
                        />
                        <span className="text-sm font-medium">
                          {entry.isDuplicate
                            ? "Duplicate — off schedules"
                            : entry.included
                              ? "Include on schedules"
                              : "Excluded"}
                        </span>
                      </label>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{entry.creditorName}</p>
                          <Badge variant="outline">Schedule {entry.schedule}</Badge>
                          <Badge variant="outline">{entry.accountType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Balance ${entry.balance}
                          {entry.monthlyPayment ? ` · $${entry.monthlyPayment}/mo` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.rationale}</p>

                        <TradelineControls
                          entry={entry}
                          duplicateOptions={duplicateOptions}
                          saving={savingId === entry.id}
                          onScheduleChange={(schedule) =>
                            void applyPatch(entry, { schedule })
                          }
                          onMarkDuplicate={(isDuplicate, duplicateOfId) =>
                            void applyPatch(entry, {
                              isDuplicate,
                              duplicateOfId: duplicateOfId ?? null,
                            })
                          }
                        />

                        <div
                          className={cn(
                            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
                            entry.advice.recommendation === "keep"
                              ? "border-emerald-200 bg-success-muted/50"
                              : "border-amber-200 bg-warning-muted/50"
                          )}
                        >
                          {entry.advice.recommendation === "keep" ? (
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                          ) : (
                            <Scale className="mt-0.5 size-3.5 shrink-0 text-warning" />
                          )}
                          <div>
                            <p className="font-semibold uppercase tracking-wide opacity-70">
                              AI recommends: {entry.advice.recommendation}
                            </p>
                            <p className="mt-0.5 leading-relaxed">{entry.advice.reason}</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 self-start text-muted-foreground"
                        disabled={savingId === entry.id || entry.isDuplicate}
                        onClick={() => void toggleIncluded(entry, !entry.included)}
                      >
                        {entry.included && !entry.isDuplicate ? (
                          <>
                            <Trash2 className="size-3.5" />
                            Exclude
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5" />
                            Re-include
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {showAddCreditor && (
        <AddCreditorModal
          onClose={() => setShowAddCreditor(false)}
          onSubmit={handleAddCreditor}
        />
      )}
    </div>
  );
}
