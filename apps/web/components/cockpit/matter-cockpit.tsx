"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useReviewStore } from "@/lib/store/review-store";
import { FieldReviewCard } from "@/components/cockpit/field-review-card";
import { DiagnosticsPanel } from "@/components/cockpit/diagnostics-panel";
import { MatterTree } from "@/components/cockpit/matter-tree";
import { GodButton } from "@/components/cockpit/god-button";

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

  useEffect(() => {
    void init(matterId);
  }, [matterId, init]);

  const currentField = fields[currentIndex];
  const approvedCount = fields.filter((f) => f.approvalState === "approved").length;

  const handleBulkApprove = async () => {
    await bulkApprove(0.95);
  };

  return (
    <div className="flex h-screen">
      <MatterTree activeSection="ef" matterId={matterId} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[var(--border)] bg-white px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Martinez — Chapter 7</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              CACB · {loading ? "Loading…" : `${pendingCount()} fields pending review`}
              {error && ` · ${error}`}
            </p>
          </div>
          <div className="flex gap-2">
            {!creditSummary && (
              <button
                type="button"
                onClick={() => void pullTriMerge()}
                disabled={loading}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                Pull Tri-Merge Credit
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleBulkApprove()}
              className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition"
            >
              Approve all &gt;95%
            </button>
            <kbd className="text-xs px-2 py-1 bg-[var(--muted)] rounded border border-[var(--border)]">
              ⌘K
            </kbd>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                <button type="button" onClick={prev} disabled={currentIndex === 0}>
                  ← Prev
                </button>
                <span>
                  {fields.length > 0 ? currentIndex + 1 : 0} of {fields.length}
                </span>
                <button
                  type="button"
                  onClick={next}
                  disabled={currentIndex >= fields.length - 1}
                >
                  Next →
                </button>
              </div>

              <AnimatePresence mode="wait">
                {currentField && (
                  <FieldReviewCard
                    key={currentField.id}
                    field={currentField}
                    onApprove={() => void approve(currentField.id)}
                    onEdit={() => {
                      const val = prompt("Edit value:", String(currentField.proposedValue));
                      if (val !== null) edit(currentField.id, val);
                    }}
                    onQuestion={() => void question(currentField.id)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-80 border-l border-[var(--border)] bg-[var(--muted)] p-4 hidden lg:block">
            <div className="bg-white border border-[var(--border)] rounded-lg h-full flex items-center justify-center text-[var(--muted-foreground)] text-sm text-center p-4">
              Official USC PDF Preview
              <br />
              (Form {currentField?.formId ?? "—"})
            </div>
          </div>
        </div>
      </main>

      <DiagnosticsPanel
        diagnostics={diagnostics}
        creditSummary={creditSummary}
        pendingCount={pendingCount()}
        approvedCount={approvedCount}
        matterId={matterId}
      />
    </div>
  );
}
