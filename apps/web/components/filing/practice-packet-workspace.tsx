"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Printer,
  RefreshCw,
} from "lucide-react";
import {
  fetchCourtPacketPreview,
  type CourtPacketPreview,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourtFormSheet } from "@/components/filing/court-form-sheet";
import { PracticeModeBanner } from "@/components/filing/practice-mode-banner";
import { printCourtPacketPages } from "@/components/filing/court-packet-print";

const STATUS_VARIANT: Record<
  CourtPacketPreview["pages"][number]["status"],
  "success" | "warning" | "secondary"
> = {
  ready: "success",
  needs_review: "warning",
  building: "secondary",
};

export function PracticePacketWorkspace({ matterId }: { matterId: string }) {
  const [preview, setPreview] = useState<CourtPacketPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { preview: data } = await fetchCourtPacketPreview(matterId, { practice: true });
      setPreview(data);
      setActivePage((i) => Math.min(i, Math.max(0, data.pages.length - 1)));
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = preview?.pages[activePage];
  const readyCount = preview?.pages.filter((p) => p.status === "ready").length ?? 0;
  const totalPages = preview?.pages.length ?? 0;

  if (loading && !preview) {
    return (
      <div className="practice-workspace flex min-h-[480px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="practice-workspace">
      <PracticeModeBanner
        efileMode={preview.efileMode}
        liveFilingBlocked={preview.liveFilingBlocked}
      />

      <header className="practice-workspace__header">
        <div>
          <p className="practice-workspace__eyebrow">{BRAND.practiceMode.name}</p>
          <h1 className="practice-workspace__title">{preview.debtorName}</h1>
          <p className="practice-workspace__sub">
            Chapter {preview.chapter} · {preview.district} · {totalPages} court papers ·{" "}
            {readyCount} ready · {preview.petitionCompletion}% petition complete
          </p>
        </div>
        <div className="practice-workspace__header-actions">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printCourtPacketPages(preview)}
          >
            <Printer className="size-4" />
            Print all
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/matters/${matterId}/forge?section=seal`}>{BRAND.sealCheck.name}</Link>
          </Button>
          <Button asChild size="sm" variant="default">
            <Link href={`/matters/${matterId}/forge?section=file`}>
              {preview.liveFilingBlocked ? "Sandbox e-file" : BRAND.gavel.action}
            </Link>
          </Button>
        </div>
      </header>

      <div className="practice-workspace__layout">
        <aside className="practice-workspace__sidebar" aria-label="Court papers">
          <p className="practice-workspace__sidebar-title">Every court paper</p>
          <ul className="practice-workspace__paper-list">
            {preview.pages.map((page, idx) => (
              <li key={page.formId}>
                <button
                  type="button"
                  className={cn(
                    "practice-workspace__paper-item",
                    idx === activePage && "practice-workspace__paper-item--active"
                  )}
                  onClick={() => setActivePage(idx)}
                >
                  <span className="practice-workspace__paper-form">{page.formId}</span>
                  <span className="practice-workspace__paper-label">{page.label}</span>
                  <Badge variant={STATUS_VARIANT[page.status]} className="text-[10px]">
                    {page.completionPercent}%
                  </Badge>
                </button>
              </li>
            ))}
          </ul>

          <p className="practice-workspace__sidebar-title mt-6">Prep tools</p>
          <ul className="practice-workspace__tool-list">
            {preview.attorneyTools
              .filter((t) => t.id !== "practice")
              .map((tool) => (
                <li key={tool.id}>
                  <Link href={tool.href} className="practice-workspace__tool-link">
                    <span>{tool.icon}</span>
                    <span>
                      <strong>{tool.label}</strong>
                      <span className="block text-xs text-muted-foreground">{tool.description}</span>
                    </span>
                    <ExternalLink className="size-3 shrink-0 opacity-50" />
                  </Link>
                </li>
              ))}
          </ul>
        </aside>

        <main className="practice-workspace__main">
          <div className="practice-workspace__pager">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activePage <= 0}
              onClick={() => setActivePage((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Paper {activePage + 1} of {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activePage >= totalPages - 1}
              onClick={() => setActivePage((i) => Math.min(totalPages - 1, i + 1))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {current ? (
            <>
              <CourtFormSheet
                preview={preview}
                page={current}
                watermark="PRACTICE COPY — NOT FILED"
              />
              <div className="practice-workspace__paper-actions">
                <Button asChild variant="secondary">
                  <Link href={current.editHref}>{current.editLabel}</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => printCourtPacketPages(preview, [activePage])}
                >
                  <Printer className="size-4" />
                  Print this paper
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a court paper from the list.</p>
          )}
        </main>
      </div>

      <footer className="practice-workspace__checklist">
        <p className="font-semibold">Before you sandbox file</p>
        <ol className="practice-workspace__steps">
          <li className={readyCount === totalPages ? "done" : ""}>
            Review every paper above — edit fields until each shows ready
          </li>
          <li className={preview.readyForGavel ? "done" : ""}>
            Complete {BRAND.sealCheck.name} (documents QA, numbers QA, attorney sign-off)
          </li>
          <li>
            Run sandbox e-file from{" "}
            <Link href={`/matters/${matterId}/forge?section=file`}>Filing packet</Link> — no PACER
            submission until production cutover
          </li>
        </ol>
      </footer>
    </div>
  );
}
