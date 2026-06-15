"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Loader2, Scale } from "lucide-react";
import {
  fetchMatterDossier,
  saveConsultApi,
  type ConsultSnapshot,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TAKE_LABELS = {
  yes: { label: "Take case", variant: "success" as const },
  maybe: { label: "Maybe — need more", variant: "warning" as const },
  no: { label: "Pass", variant: "secondary" as const },
};

export function ReliefScoutPanel({ matterId }: { matterId: string }) {
  const [form, setForm] = useState({
    debtorName: "",
    householdSize: 2,
    annualIncome: "72000",
    monthlyExpenses: "3200",
    securedDebt: "30000",
    unsecuredDebt: "45000",
    chapterPreference: "7" as "7" | "13" | "undecided",
    takeCase: null as "yes" | "maybe" | "no" | null,
    attorneyNotes: "",
  });
  const [result, setResult] = useState<ConsultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dossier } = await fetchMatterDossier(matterId);
      const profile = dossier.intakeProfile;
      const debtorFromProfile = profile
        ? [profile.clientFirstName, profile.clientLastName].filter(Boolean).join(" ").trim() ||
          profile.debtorDisplayName
        : "";

      if (dossier.consult) {
        const c = dossier.consult;
        setForm((prev) => ({
          ...prev,
          debtorName: c.debtorName || debtorFromProfile || prev.debtorName,
          householdSize: c.householdSize || prev.householdSize,
          annualIncome: c.annualIncome
            ? c.annualIncome.replace(/\.00$/, "")
            : prev.annualIncome,
          monthlyExpenses: c.monthlyExpenses
            ? c.monthlyExpenses.replace(/\.00$/, "")
            : prev.monthlyExpenses,
          securedDebt: c.securedDebt ? c.securedDebt.replace(/\.00$/, "") : prev.securedDebt,
          unsecuredDebt: c.unsecuredDebt
            ? c.unsecuredDebt.replace(/\.00$/, "")
            : prev.unsecuredDebt,
          chapterPreference:
            c.chapterPreference !== "undecided"
              ? c.chapterPreference
              : profile?.chapter ?? prev.chapterPreference,
          takeCase: c.takeCase,
          attorneyNotes: c.attorneyNotes || prev.attorneyNotes,
        }));
        if (c.evaluatedAt) setResult(c);
      } else if (debtorFromProfile) {
        setForm((prev) => ({
          ...prev,
          debtorName: debtorFromProfile,
          chapterPreference: profile?.chapter ?? prev.chapterPreference,
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runScout = async () => {
    setSaving(true);
    try {
      const income = form.annualIncome.includes(".")
        ? form.annualIncome
        : `${form.annualIncome}.00`;
      const { consult } = await saveConsultApi(matterId, {
        ...form,
        annualIncome: income,
        monthlyExpenses: form.monthlyExpenses.includes(".")
          ? form.monthlyExpenses
          : `${form.monthlyExpenses}.00`,
        securedDebt: form.securedDebt.includes(".") ? form.securedDebt : `${form.securedDebt}.00`,
        unsecuredDebt: form.unsecuredDebt.includes(".")
          ? form.unsecuredDebt
          : `${form.unsecuredDebt}.00`,
        evaluate: true,
      });
      setResult(consult);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <header>
        <Badge className="mb-2">{BRAND.reliefScout.name}</Badge>
        <h1 className="font-display text-3xl font-bold">First consult walkthrough</h1>
        <p className="mt-2 text-muted-foreground">{BRAND.reliefScout.description}</p>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Debtor name
            </span>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.debtorName}
              onChange={(e) => setForm((f) => ({ ...f, debtorName: e.target.value }))}
              placeholder="Maria Martinez"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Household size
            </span>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.householdSize}
              onChange={(e) =>
                setForm((f) => ({ ...f, householdSize: parseInt(e.target.value, 10) || 1 }))
              }
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Annual income ($)
            </span>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.annualIncome}
              onChange={(e) => setForm((f) => ({ ...f, annualIncome: e.target.value }))}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Monthly expenses ($)
            </span>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.monthlyExpenses}
              onChange={(e) => setForm((f) => ({ ...f, monthlyExpenses: e.target.value }))}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Secured debt ($)
            </span>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.securedDebt}
              onChange={(e) => setForm((f) => ({ ...f, securedDebt: e.target.value }))}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Unsecured debt ($)
            </span>
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.unsecuredDebt}
              onChange={(e) => setForm((f) => ({ ...f, unsecuredDebt: e.target.value }))}
            />
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Chapter preference
            </span>
            <div className="flex flex-wrap gap-2">
              {(["7", "13", "undecided"] as const).map((ch) => (
                <Button
                  key={ch}
                  type="button"
                  size="sm"
                  variant={form.chapterPreference === ch ? "default" : "secondary"}
                  onClick={() => setForm((f) => ({ ...f, chapterPreference: ch }))}
                >
                  Ch {ch === "undecided" ? "?" : ch}
                </Button>
              ))}
            </div>
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your decision
            </span>
            <div className="flex flex-wrap gap-2">
              {(["yes", "maybe", "no"] as const).map((key) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={form.takeCase === key ? "default" : "secondary"}
                  onClick={() => setForm((f) => ({ ...f, takeCase: key }))}
                >
                  {TAKE_LABELS[key].label}
                </Button>
              ))}
            </div>
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Consult notes (saved to matter file)
            </span>
            <textarea
              className="min-h-[100px] w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={form.attorneyNotes}
              onChange={(e) => setForm((f) => ({ ...f, attorneyNotes: e.target.value }))}
              placeholder="Met at office — spouse not filing. Wants to keep car. Discussed fees…"
            />
          </label>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full shadow-glow"
        disabled={!form.debtorName || saving}
        onClick={() => void runScout()}
      >
        {saving ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <Calculator />
            Run means test & save to file
          </>
        )}
      </Button>

      {result?.evaluatedAt && (
        <Card
          className={cn(
            "border-2",
            result.meansTestStatus === "pass"
              ? "border-emerald-200 bg-emerald-50/40"
              : result.meansTestStatus === "fail"
                ? "border-amber-200 bg-amber-50/40"
                : "border-indigo-200 bg-indigo-50/40"
          )}
        >
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Scale className="size-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Means test snapshot</h2>
              <Badge
                variant={
                  result.meansTestStatus === "pass"
                    ? "success"
                    : result.meansTestStatus === "fail"
                      ? "warning"
                      : "default"
                }
              >
                {result.meansTestStatus?.toUpperCase()}
              </Badge>
              {result.takeCase && (
                <Badge variant={TAKE_LABELS[result.takeCase].variant}>
                  {TAKE_LABELS[result.takeCase].label}
                </Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed">{result.recommendationRationale}</p>
            <p className="text-xs text-muted-foreground">
              Recommendation: Ch{" "}
              {result.recommendation === "chapter_7"
                ? "7"
                : result.recommendation === "chapter_13"
                  ? "13"
                  : "review"}{" "}
              · Evaluated {result.evaluatedAt.slice(0, 16).replace("T", " ")}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {(result.takeCase === "yes" || result.takeCase === "maybe") && (
                <Button asChild size="lg" className="shadow-glow">
                  <Link href={`/matters/${matterId}/forge`}>
                    Enter {BRAND.forge.name}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="secondary">
                <Link href={`/matters/${matterId}/forge?section=messages`}>
                  Send Client Vault link
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
