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
import { FieldReviewCard } from "@/components/cockpit/field-review-card";
import { DiagnosticsPanel } from "@/components/cockpit/diagnostics-panel";
import { MatterSidebar } from "@/components/layout/matter-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  } = useReviewStore();

  const [editValue, setEditValue] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void init(matterId);
  }, [matterId, init]);

  const currentField = fields[currentIndex];
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">Martinez — Chapter 7</h1>
              <Badge variant="secondary">CACB</Badge>
              <ApiStatusDot />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {loading ? "Loading matter…" : `${pending} fields awaiting approval`}
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
                  {fields.length > 0 ? currentIndex + 1 : 0} / {fields.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={next}
                  disabled={currentIndex >= fields.length - 1}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {currentField && (
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
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden w-72 shrink-0 border-l border-border bg-slate-50 p-4 xl:block">
            <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-white p-6 text-center">
              <FileText className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Official PDF Preview</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Form {currentField?.formId ?? "—"}
              </p>
              {currentField?.sourceDocument && (
                <Badge variant="outline" className="mt-4">
                  {currentField.sourceDocument.fileName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </main>

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
