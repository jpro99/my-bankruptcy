"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { ManualCreditorInput } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SCHEDULE_OPTIONS: { value: ManualCreditorInput["schedule"]; label: string }[] = [
  { value: "D", label: "Schedule D — Secured" },
  { value: "E", label: "Schedule E — Priority unsecured" },
  { value: "F", label: "Schedule F — Nonpriority unsecured" },
  { value: "G", label: "Schedule G — Executory / lease" },
];

interface AddCreditorModalProps {
  onClose: () => void;
  onSubmit: (input: ManualCreditorInput) => Promise<void>;
}

export function AddCreditorModal({ onClose, onSubmit }: AddCreditorModalProps) {
  const [creditorName, setCreditorName] = useState("");
  const [balance, setBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [collateralDescription, setCollateralDescription] = useState("");
  const [schedule, setSchedule] = useState<ManualCreditorInput["schedule"]>("F");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditorName.trim() || !balance.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        creditorName: creditorName.trim(),
        balance: balance.trim(),
        schedule,
        monthlyPayment: monthlyPayment.trim() || undefined,
        collateralDescription: collateralDescription.trim() || undefined,
        accountType: "Manual entry",
      });
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
        aria-labelledby="add-creditor-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-muted">
              <Plus className="size-5 text-primary" />
            </div>
            <div>
              <h2 id="add-creditor-title" className="font-display text-lg font-bold">
                Add creditor not on credit report
              </h2>
              <p className="text-xs text-muted-foreground">
                Medical bills, personal loans, landlord claims, etc.
              </p>
            </div>
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
              Creditor name
            </label>
            <Input
              value={creditorName}
              onChange={(e) => setCreditorName(e.target.value)}
              placeholder="e.g. UCLA Medical Center"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Balance owed
              </label>
              <Input
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="4500.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Monthly payment (optional)
              </label>
              <Input
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="125.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Schedule
            </label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as ManualCreditorInput["schedule"])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {SCHEDULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {schedule === "D" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Collateral (secured debt)
              </label>
              <Input
                value={collateralDescription}
                onChange={(e) => setCollateralDescription(e.target.value)}
                placeholder="e.g. 2019 Toyota Camry"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
              Add to schedules
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
