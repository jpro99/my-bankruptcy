"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Sparkles,
} from "lucide-react";
import { useReviewStore } from "@/lib/store/review-store";
import { FieldReviewCard, ApprovalBadge } from "@/components/cockpit/field-review-card";
import { DocumentPreviewModal } from "@/components/cockpit/document-preview-modal";
import { DiagnosticsPanel } from "@/components/cockpit/diagnostics-panel";
import { MatterSidebar } from "@/components/layout/matter-shell";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/brand";
import { ApiStatusDot } from "@/components/layout/api-status-banner";

export function MatterCockpit({ matterId }: { matterId: string }) {
  const {
    fields,
    diagnostics,
    creditSummary,
    loading,
    error,
    currentIndex,
    init,
    approve,
    question,
    edit,
    next,
    prev,
    bulkApprove,
    pullTriMerge,
    pendingCount,
    pendingFields,
  } = useReviewStore();

  const [editValue, setEditValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [previewField, setPreviewField] = useState<(typeof fields)[0] | null>(null);

  useEffect(() => {
    void init(matterId);
  }, [matterId, init]);

  const queue = pendingFields();
  const currentField = queue[currentIndex];
  const approvedCount = fields.filter((f) => f.approvalState === "approved").length;
  const pending = pendingCount();

  const handleBulkApprove = async () => {
    await bulkApprove(0.95);
  };

  const startEdit = () => {
    if (!currentField) return;
    setEditValue(String(currentField.proposedValue));
    setEditing(true);
  };

  const saveEdit = () => {
    if (!currentField) return;
    edit(currentField.id, editValue);
    setEditing(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <MatterSidebar matterId={matterId} />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-white px-6 py-4">
          <div>
            <div className="mb-2">
              <BackButton fallbackHref={`/matters/${matterId}/forge`} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">{BRAND.forge.name}</h1>
              <Badge>{BRAND.forge.short}</Badge>
              <ApiStatusDot />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {BRAND.forge.description}
              {loading ? "" : ` · ${pending} fields awaiting approval`}
              {error && ` · ${error}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {!creditSummary && (
              <Button
                size="sm"
                onClick={() => void pullTriMerge()}
                disabled={loading}
              >
                <CreditCard className="size-3.5" />
                Pull Tri-Merge
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => void handleBulkApprove()}>
              <Sparkles className="size-3.5" />
              Approve &gt;95%
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-xl space-y-5">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={prev} disabled={currentIndex === 0}>
                  <ChevronLeft />
                  Previous
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {queue.length > 0 ? currentIndex + 1 : 0} / {queue.length} pending
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={next}
                  disabled={currentIndex >= queue.length - 1}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {currentField ? (
                  <FieldReviewCard
                    key={currentField.id}
                    field={currentField}
                    editing={editing}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onApprove={() => void approve(currentField.id)}
                    onEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditing(false)}
                    onQuestion={() => void question(currentField.id)}
                    onViewSource={() => setPreviewField(currentField)}
                  />
                ) : !loading ? (
                  <div className="rounded-2xl border border-emerald-200 bg-success-muted p-8 text-center">
                    <p className="font-display text-lg font-bold text-success">All caught up</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {approvedCount} field{approvedCount === 1 ? "" : "s"} approved — review schedules or run preflight.
                    </p>
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden w-72 shrink-0 border-l border-border bg-slate-50 p-4 xl:block">
            <button
              type="button"
              disabled={!currentField?.sourceDocument}
              onClick={() => currentField && setPreviewField(currentField)}
              className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white p-6 text-center transition hover:border-primary/40 hover:bg-primary-muted/20 disabled:cursor-default disabled:opacity-60"
            >
              <FileText className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                {currentField?.sourceDocument ? "Click to view source PDF" : "Official PDF Preview"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Form {currentField?.formId ?? "—"}
              </p>
              {currentField?.sourceDocument && (
                <Badge variant="outline" className="mt-4">
                  {currentField.sourceDocument.fileName}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </main>

      {previewField && (
        <DocumentPreviewModal
          field={previewField}
          onClose={() => setPreviewField(null)}
          onApprove={() => void approve(previewField.id)}
        />
      )}

      <DiagnosticsPanel
        diagnostics={diagnostics}
        creditSummary={creditSummary}
        pendingCount={pending}
        approvedCount={approvedCount}
        matterId={matterId}
      />
    </div>
  );
}
