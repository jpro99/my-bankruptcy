"use client";

import { motion } from "framer-motion";
import { Check, FileText, HelpCircle, Pencil, X } from "lucide-react";
import { cn, formatConfidence, confidenceColor } from "@/lib/utils";
import type { ReviewField } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface FieldReviewCardProps {
  field: ReviewField;
  editing?: boolean;
  editValue?: string;
  onEditValueChange?: (v: string) => void;
  onApprove: () => void;
  onEdit: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onQuestion: () => void;
  onViewSource?: () => void;
}

export function FieldReviewCard({
  field,
  editing,
  editValue,
  onEditValueChange,
  onApprove,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onQuestion,
  onViewSource,
}: FieldReviewCardProps) {
  const color = confidenceColor(field.confidence);

  return (
    <motion.div
      key={field.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden shadow-elevated">
        <div className="border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2">
                Form {field.formId}
              </Badge>
              <h3 className="font-mono text-sm font-medium">{field.fieldPath}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold" style={{ color }}>
                {formatConfidence(field.confidence)}
              </span>
              <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${field.confidence * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          {editing ? (
            <div className="space-y-3">
              <Input
                value={editValue}
                onChange={(e) => onEditValueChange?.(e.target.value)}
                className="text-lg font-semibold"
                autoFocus
              />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={onSaveEdit}>
                  Save
                </Button>
                <Button variant="secondary" onClick={onCancelEdit}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/50 p-5">
              <p className="font-display text-2xl font-bold tracking-tight">
                {typeof field.proposedValue === "string"
                  ? field.proposedValue
                  : JSON.stringify(field.proposedValue)}
              </p>
            </div>
          )}

          {field.sourceDocument && (
            <button
              type="button"
              onClick={onViewSource}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-muted/40 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary-muted hover:underline"
            >
              <FileText className="size-3.5" />
              View {field.sourceDocument.fileName}
            </button>
          )}

          {field.rationale && (
            <p className="text-sm italic leading-relaxed text-muted-foreground">{field.rationale}</p>
          )}

          {!editing && field.approvalState === "pending" ? (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button variant="success" className="h-12" onClick={onApprove}>
                <Check />
                Approve
              </Button>
              <Button variant="secondary" className="h-12" onClick={onEdit}>
                <Pencil />
                Edit
              </Button>
              <Button variant="secondary" className="h-12" onClick={onQuestion}>
                <HelpCircle />
                Ask AI
              </Button>
            </div>
          ) : !editing ? (
            <div className="flex justify-center pt-2">
              <ApprovalBadge state={field.approvalState} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ApprovalBadge({ state }: { state: ReviewField["approvalState"] }) {
  const variants: Record<ReviewField["approvalState"], "warning" | "success" | "default" | "danger"> = {
    pending: "warning",
    approved: "success",
    edited: "default",
    questioned: "danger",
  };
  return <Badge variant={variants[state]}>{state}</Badge>;
}
