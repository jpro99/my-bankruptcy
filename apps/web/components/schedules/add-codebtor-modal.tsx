"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { AddCodebtorInput } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCodebtorModalProps {
  onClose: () => void;
  onSubmit: (input: AddCodebtorInput) => Promise<void>;
}

export function AddCodebtorModal({ onClose, onSubmit }: AddCodebtorModalProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [creditorOrDebt, setCreditorOrDebt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        relationship: relationship.trim() || undefined,
        creditorOrDebt: creditorOrDebt.trim() || undefined,
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
        aria-labelledby="add-codebtor-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="add-codebtor-title" className="font-display text-lg font-bold">
              Add codebtor — Schedule H
            </h2>
            <p className="text-xs text-muted-foreground">
              Non-filing spouse, guarantor, or other person liable on a debt
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
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Martinez"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Relationship
            </label>
            <Input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Spouse, guarantor"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Creditor / debt
            </label>
            <Input
              value={creditorOrDebt}
              onChange={(e) => setCreditorOrDebt(e.target.value)}
              placeholder="e.g. Chase Visa · $4,200"
            />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
              Add to Schedule H
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
