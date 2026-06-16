"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { ASSET_CATEGORY_OPTIONS, type AddAssetInput } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddScheduleAssetModalProps {
  onClose: () => void;
  onSubmit: (input: AddAssetInput) => Promise<void>;
}

export function AddScheduleAssetModal({ onClose, onSubmit }: AddScheduleAssetModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AddAssetInput["category"]>("household_goods");
  const [currentValue, setCurrentValue] = useState("");
  const [securedAmount, setSecuredAmount] = useState("");
  const [exemptionAmount, setExemptionAmount] = useState("");
  const [exemptionSystem, setExemptionSystem] = useState("System 2");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !currentValue.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        description: description.trim(),
        category,
        currentValue: currentValue.trim(),
        securedAmount: securedAmount.trim() || undefined,
        exemptionAmount: exemptionAmount.trim() || undefined,
        exemptionSystem: exemptionSystem.trim() || undefined,
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-elevated animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-asset-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="add-asset-title" className="font-display text-lg font-bold">
              Add property — Schedule A/B
            </h2>
            <p className="text-xs text-muted-foreground">
              Beds, couches, vehicles, bank accounts, real estate, etc.
            </p>
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
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Queen bed, sectional couch, dining set"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ASSET_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Current value
              </label>
              <Input
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="2500.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Secured amount (if any)
              </label>
              <Input
                value={securedAmount}
                onChange={(e) => setSecuredAmount(e.target.value)}
                placeholder="8500.00"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Exemption amount
              </label>
              <Input
                value={exemptionAmount}
                onChange={(e) => setExemptionAmount(e.target.value)}
                placeholder="Same as value if fully exempt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Exemption system
              </label>
              <Input
                value={exemptionSystem}
                onChange={(e) => setExemptionSystem(e.target.value)}
                placeholder="System 2 / Wildcard / Federal"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
              Add to Schedule A/B
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
