"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { AddScheduleLineInput } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddScheduleLineModalProps {
  formId: "106I" | "106J" | "107";
  onClose: () => void;
  onSubmit: (input: AddScheduleLineInput) => Promise<void>;
}

export function AddScheduleLineModal({ formId, onClose, onSubmit }: AddScheduleLineModalProps) {
  const [lineLabel, setLineLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const title =
    formId === "106J"
      ? "Add expense — Schedule J"
      : formId === "107"
        ? "Add SOFA question — Form 107"
        : "Add income — Schedule I";
  const hint =
    formId === "106J"
      ? "Custom monthly expense not covered by the standard form lines"
      : formId === "107"
        ? "Additional disclosure question for Statement of Financial Affairs"
        : "Additional income source for Schedule I";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineLabel.trim() || !amount.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ formId, lineLabel: lineLabel.trim(), amount: amount.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-elevated animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-line-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="add-line-title" className="font-display text-lg font-bold">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Line description
            </label>
            <Input
              value={lineLabel}
              onChange={(e) => setLineLabel(e.target.value)}
              placeholder={
                formId === "106J" ? "e.g. Childcare, storage unit" : "e.g. Rental income, side gig"
              }
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {formId === "107" ? "Answer (Yes / No / N/A or details)" : "Monthly amount"}
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={formId === "107" ? "No — or Yes: transferred 2019 Camry" : "350.00"}
              required
            />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
              Add line
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
