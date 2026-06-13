"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import {
  fetchFinalReview,
  updateFinalReviewStep,
  type FinalReviewSnapshot,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FinalCheckPanel({ matterId }: { matterId: string }) {
  const [review, setReview] = useState<FinalReviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [attorneyName, setAttorneyName] = useState("Attorney");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFinalReview(matterId);
      setReview(data.finalReview);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const completeStep = async (
    step: "documentsQa" | "numbersQa" | "attorneySignOff",
    complete: boolean
  ) => {
    setBusy(step);
    try {
      const data = await updateFinalReviewStep(matterId, step, {
        complete,
        attorneyName: step === "attorneySignOff" ? attorneyName : undefined,
      });
      setReview(data.finalReview);
    } finally {
      setBusy(null);
    }
  };

  if (loading || !review) {
    return <Loader2 className="size-6 animate-spin text-primary" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Final Check — before {BRAND.gavel.name}</h2>
        <p className="text-sm text-muted-foreground">
          Staff verifies documents, paralegal confirms numbers won&apos;t raise judge flags, attorney
          gives final thumbs-up.
        </p>
      </header>

      <div
        className={`rounded-xl border p-4 text-center ${
          review.readyForGavel ? "border-emerald-300 bg-emerald-50" : "border-amber-200 bg-amber-50"
        }`}
      >
        <p className="font-semibold">
          {review.readyForGavel ? "Cleared to Strike The Gavel" : "Not cleared for filing yet"}
        </p>
        {!review.readyForGavel && (
          <p className="mt-1 text-xs text-muted-foreground">
            Complete all three steps below with no judge-flag errors.
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <CheckStep
          title="1. Documents QA"
          done={review.documentsQaComplete}
          busy={busy === "documentsQa"}
          onToggle={() => void completeStep("documentsQa", !review.documentsQaComplete)}
          description="All client uploads staff-verified"
        />
        <CheckStep
          title="2. Numbers review"
          done={review.numbersQaComplete}
          busy={busy === "numbersQa"}
          onToggle={() => void completeStep("numbersQa", !review.numbersQaComplete)}
          description="Schedules & means test — nothing that alerts the trustee"
        />
        <CheckStep
          title="3. Attorney sign-off"
          done={review.attorneySignOff}
          busy={busy === "attorneySignOff"}
          onToggle={() => void completeStep("attorneySignOff", !review.attorneySignOff)}
          description="Final thumbs-up to file"
          extra={
            !review.attorneySignOff && (
              <input
                className="mt-2 w-full rounded border px-2 py-1 text-xs"
                value={attorneyName}
                onChange={(e) => setAttorneyName(e.target.value)}
                placeholder="Attorney name"
              />
            )
          }
        />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="flex items-center gap-2 font-semibold text-sm">
            <ShieldCheck className="size-4 text-primary" />
            Judge / trustee flags
          </p>
          {review.judgeFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flags detected.</p>
          ) : (
            <ul className="space-y-2">
              {review.judgeFlags.map((f) => (
                <li
                  key={f.id}
                  className={`flex gap-2 rounded-lg border p-2 text-sm ${
                    f.severity === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  {f.severity === "error" ? (
                    <AlertTriangle className="size-4 shrink-0 text-red-600" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <Badge variant="outline" className="text-[10px]">
                      {f.category}
                    </Badge>
                    <p className="mt-1">{f.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {review.readyForGavel && (
        <Button asChild className="w-full" size="lg">
          <Link href={`/matters/${matterId}/forge`}>
            <ThumbsUp className="size-4" />
            Open {BRAND.forge.name} → {BRAND.gavel.action}
          </Link>
        </Button>
      )}
    </div>
  );
}

function CheckStep({
  title,
  description,
  done,
  busy,
  onToggle,
  extra,
}: {
  title: string;
  description: string;
  done: boolean;
  busy: boolean;
  onToggle: () => void;
  extra?: ReactNode;
}) {
  return (
    <Card className={done ? "border-emerald-200" : ""}>
      <CardContent className="p-4">
        <p className="font-semibold text-sm">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        {extra}
        <Button
          className="mt-3 w-full"
          size="sm"
          variant={done ? "secondary" : "default"}
          disabled={busy}
          onClick={onToggle}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : done ? (
            <>
              <CheckCircle2 className="size-4 text-success" />
              Done — undo
            </>
          ) : (
            "Mark complete"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
