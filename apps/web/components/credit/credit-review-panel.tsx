"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Scale, Trash2, XCircle } from "lucide-react";
import {
  fetchCreditReview,
  pullCredit,
  setTradelineIncluded,
  type TradelineReviewEntry,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CreditReviewPanel({ matterId }: { matterId: string }) {
  const [entries, setEntries] = useState<TradelineReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveLimited, setSaveLimited] = useState(false);

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

  const toggleIncluded = async (entry: TradelineReviewEntry, included: boolean) => {
    if (saveLimited) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, included } : e))
      );
      return;
    }
    setSavingId(entry.id);
    try {
      const res = await setTradelineIncluded(matterId, entry.id, included);
      setEntries(res.entries);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save — try again after API redeploys"
      );
    } finally {
      setSavingId(null);
    }
  };

  const includedCount = entries.filter((e) => e.included).length;

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
            Go line-by-line through the tri-merge. AI suggests keep or exclude — you decide with
            the checkbox. Excluded items drop off Schedules D/E/F/G.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handlePull()} disabled={pulling}>
            {pulling ? <Loader2 className="animate-spin" /> : "Pull tri-merge credit"}
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/matters/${matterId}/schedules`}>View schedules</Link>
          </Button>
        </div>
      </header>

      {saveLimited && entries.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-warning-muted px-4 py-3 text-sm text-amber-900">
          API update deploying — you can review lines now. Keep/exclude saves fully once Railway
          finishes redeploying (a few minutes).
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger-muted px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No credit report yet — click <strong>Pull tri-merge credit</strong> above.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="success">{includedCount} included on petition</Badge>
            <Badge variant="secondary">{entries.length - includedCount} excluded</Badge>
          </div>

          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card
                  className={cn(
                    "transition",
                    !entry.included && "opacity-60",
                    entry.advice.recommendation === "exclude" &&
                      entry.included &&
                      "border-amber-200"
                  )}
                >
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                    <label className="flex shrink-0 cursor-pointer items-center gap-3 pt-1">
                      <input
                        type="checkbox"
                        className="size-5 rounded border-border accent-primary"
                        checked={entry.included}
                        disabled={savingId === entry.id}
                        onChange={(e) => void toggleIncluded(entry, e.target.checked)}
                      />
                      <span className="text-sm font-medium">
                        {entry.included ? "Include on schedules" : "Excluded"}
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
                      className="shrink-0 text-muted-foreground"
                      disabled={savingId === entry.id}
                      onClick={() => void toggleIncluded(entry, !entry.included)}
                    >
                      {entry.included ? (
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
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
