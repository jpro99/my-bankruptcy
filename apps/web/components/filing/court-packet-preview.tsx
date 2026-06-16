"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Loader2,
  PanelRight,
  Printer,
  RefreshCw,
  Rows3,
  X,
} from "lucide-react";
import {
  fetchCourtPacketPreview,
  type CourtPacketPreview,
  type CourtPacketPage,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourtFormSheet } from "@/components/filing/court-form-sheet";
import { PracticeModeBanner } from "@/components/filing/practice-mode-banner";
import { printCourtPacketPages } from "@/components/filing/court-packet-print";
import { openCourtFormPdf, openCourtPacketPdf } from "@/lib/court-pdf-download";
import "@/styles/court-form.css";

export type CourtPreviewLayout = "inline" | "drawer" | "fullscreen";

const LAYOUT_KEY = "court-preview-layout";

const STATUS_VARIANT: Record<CourtPacketPage["status"], "success" | "warning" | "secondary"> = {
  ready: "success",
  needs_review: "warning",
  building: "secondary",
};

const STATUS_LABEL: Record<CourtPacketPage["status"], string> = {
  ready: "Ready",
  needs_review: "Needs review",
  building: "Building",
};

function loadLayoutPreference(): CourtPreviewLayout {
  if (typeof window === "undefined") return "inline";
  const stored = window.localStorage.getItem(LAYOUT_KEY);
  if (stored === "drawer" || stored === "fullscreen" || stored === "inline") return stored;
  return "inline";
}

export function CourtPacketPreview({
  matterId,
  layout: layoutProp,
  onClose,
  onLayoutChange,
}: {
  matterId: string;
  layout?: CourtPreviewLayout;
  onClose?: () => void;
  onLayoutChange?: (layout: CourtPreviewLayout) => void;
}) {
  const [preview, setPreview] = useState<CourtPacketPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [layout, setLayout] = useState<CourtPreviewLayout>(layoutProp ?? "inline");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (layoutProp) setLayout(layoutProp);
    else setLayout(loadLayoutPreference());
  }, [layoutProp]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { preview: data } = await fetchCourtPacketPreview(matterId);
      setPreview(data);
      setActivePage((i) => Math.min(i, Math.max(0, data.pages.length - 1)));
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setLayoutMode = (next: CourtPreviewLayout) => {
    if (next === "fullscreen" && layout !== "fullscreen") {
      window.open(`/matters/${matterId}/court-preview`, "_blank", "noopener,noreferrer");
      return;
    }
    setLayout(next);
    window.localStorage.setItem(LAYOUT_KEY, next);
    onLayoutChange?.(next);
  };

  const current = preview?.pages[activePage];

  const shellClass = cn(
    "court-packet-preview flex flex-col bg-background",
    layout === "drawer" && "court-packet-preview--drawer",
    layout === "fullscreen" && "court-packet-preview--fullscreen min-h-screen",
    layout === "inline" && "rounded-xl border border-border"
  );

  if (loading && !preview) {
    return (
      <div className={cn(shellClass, "items-center justify-center p-12")}>
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className={shellClass}>
      {preview.liveFilingBlocked && (
        <div className="px-4 pt-4">
          <PracticeModeBanner
            compact
            efileMode={preview.efileMode}
            liveFilingBlocked={preview.liveFilingBlocked}
          />
        </div>
      )}

      <header className="court-packet-preview__header flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Court packet preview
          </p>
          <h2 className="font-display text-lg font-bold">{preview.debtorName}</h2>
          <p className="text-xs text-muted-foreground">
            Chapter {preview.chapter} · {preview.district} · {preview.petitionCompletion}% complete
            {preview.readyForGavel ? ` · ${BRAND.gavel.clearedLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="demand-preview-mode-toggle">
            {(
              [
                { id: "inline" as const, label: "Inline", icon: Rows3 },
                { id: "drawer" as const, label: "Side panel", icon: PanelRight },
                { id: "fullscreen" as const, label: "New window", icon: ExternalLink },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                className={cn(
                  "demand-preview-mode-toggle__btn flex items-center gap-1",
                  layout === id && "demand-preview-mode-toggle__btn--active"
                )}
                onClick={() => setLayoutMode(id)}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pdfLoading || !preview.pages.length}
            onClick={() => {
              setPdfError(null);
              setPdfLoading(true);
              void openCourtPacketPdf(matterId)
                .catch((e) => setPdfError(e instanceof Error ? e.message : "PDF failed"))
                .finally(() => setPdfLoading(false));
            }}
          >
            {pdfLoading ? <Loader2 className="animate-spin" /> : <FileText className="size-4" />}
            Official PDF
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/matters/${matterId}/practice`}>{BRAND.practiceMode.short} filing</Link>
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close preview">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </header>

      {pdfError && (
        <p className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {pdfError}
        </p>
      )}

      <div className="court-packet-preview__tools border-b border-border bg-muted/30 px-4 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Attorney toolkit — not just schedules
        </p>
        <div className="flex flex-wrap gap-2">
          {preview.attorneyTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:bg-primary-muted/30"
              title={tool.description}
            >
              <span>{tool.icon}</span>
              {tool.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="court-packet-preview__body flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="court-packet-preview__list shrink-0 border-b border-border lg:w-64 lg:border-b-0 lg:border-r">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">
            Pages for court ({preview.pages.length})
          </p>
          <ul className="max-h-64 overflow-y-auto lg:max-h-none lg:flex-1">
            {preview.pages.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                Approve petition fields to populate court pages.
              </li>
            ) : (
              preview.pages.map((page, i) => (
                <li key={page.formId}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 border-l-2 px-4 py-2.5 text-left text-sm transition",
                      activePage === i
                        ? "border-primary bg-primary-muted/40 font-medium"
                        : "border-transparent hover:bg-muted/50"
                    )}
                    onClick={() => setActivePage(i)}
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {page.formId}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{page.label}</span>
                      <Badge variant={STATUS_VARIANT[page.status]} className="mt-1 text-[10px]">
                        {STATUS_LABEL[page.status]} · {page.completionPercent}%
                      </Badge>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          {current ? (
            <>
              <CourtFormSheet
                preview={preview}
                page={current}
                watermark={preview.liveFilingBlocked ? "PREVIEW — NOT FILED" : undefined}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={current.editHref}>{current.editLabel} →</Link>
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  disabled={pdfLoading}
                  onClick={() => {
                    setPdfError(null);
                    setPdfLoading(true);
                    void openCourtFormPdf(matterId, current.formId)
                      .catch((e) => setPdfError(e instanceof Error ? e.message : "PDF failed"))
                      .finally(() => setPdfLoading(false));
                  }}
                >
                  <FileText className="size-4" />
                  Official PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printCourtPacketPages(preview, [activePage])}
                >
                  <Printer className="size-4" />
                  Print this page
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printCourtPacketPages(preview)}
                >
                  <Printer className="size-4" />
                  Print all pages
                </Button>
                {!preview.readyForGavel && (
                  <Button asChild size="sm">
                    <Link href={`/matters/${matterId}/forge?section=seal`}>{BRAND.sealCheck.name} →</Link>
                  </Button>
                )}
                {preview.readyForGavel && (
                  <Button asChild size="sm">
                    <Link href={`/matters/${matterId}/forge/review`}>{BRAND.gavel.action} →</Link>
                  </Button>
                )}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Live preview — updates as you edit {BRAND.reliefScout.short.toLowerCase()}, schedules,
                credit, and petition review. Open{" "}
                <Link href={`/matters/${matterId}/practice`} className="font-semibold text-primary">
                  {BRAND.practiceMode.name}
                </Link>{" "}
                to walk every paper before sandbox e-file.
              </p>
            </>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Approve petition fields to populate court pages — or open practice mode for the full packet list.</p>
              <Button asChild size="sm">
                <Link href={`/matters/${matterId}/practice`}>{BRAND.practiceMode.name} →</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function CourtPacketPreviewDrawer({
  matterId,
  open,
  onClose,
}: {
  matterId: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="court-packet-drawer-backdrop" role="presentation" onClick={onClose}>
      <div
        className="court-packet-drawer"
        role="dialog"
        aria-label="Court packet preview"
        onClick={(e) => e.stopPropagation()}
      >
        <CourtPacketPreview matterId={matterId} layout="drawer" onClose={onClose} />
      </div>
    </div>
  );
}
