"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn, formatConfidence, confidenceColor } from "@/lib/utils";
import type { ReviewField } from "@/lib/types";

interface FieldReviewCardProps {
  field: ReviewField;
  onApprove: () => void;
  onEdit: () => void;
  onQuestion: () => void;
}

export function FieldReviewCard({
  field,
  onApprove,
  onEdit,
  onQuestion,
}: FieldReviewCardProps) {
  return (
    <motion.div
      key={field.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Form {field.formId}
          </span>
          <h3 className="text-sm font-mono text-[var(--foreground)]">{field.fieldPath}</h3>
        </div>
        <ConfidenceBar confidence={field.confidence} />
      </div>

      <div className="bg-[var(--muted)] rounded-lg p-4">
        <p className="text-2xl font-semibold">
          {typeof field.proposedValue === "string"
            ? field.proposedValue
            : JSON.stringify(field.proposedValue)}
        </p>
      </div>

      {field.sourceDocument && (
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
        >
          📄 {field.sourceDocument.fileName}
          {field.sourceDocument.boundingBox && " · highlighted"}
        </button>
      )}

      {field.rationale && (
        <p className="text-sm text-[var(--muted-foreground)] italic">{field.rationale}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onApprove}
          className="flex-1 py-3 bg-[var(--success)] text-white rounded-lg font-medium hover:opacity-90 transition text-lg"
        >
          ✅ Approve
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          onClick={onQuestion}
          className="flex-1 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition"
        >
          ❓ Ask AI
        </button>
      </div>
    </motion.div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidenceColor(confidence);
  return (
    <div className="text-right">
      <span className="text-sm font-semibold" style={{ color }}>
        {formatConfidence(confidence)}
      </span>
      <div className="w-24 h-2 bg-[var(--muted)] rounded-full mt-1 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${confidence * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ApprovalBadge({ state }: { state: ReviewField["approvalState"] }) {
  const styles: Record<ReviewField["approvalState"], string> = {
    pending: "bg-yellow-50 text-yellow-700",
    approved: "bg-green-50 text-green-700",
    edited: "bg-blue-50 text-blue-700",
    questioned: "bg-red-50 text-red-700",
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", styles[state])}>
      {state}
    </span>
  );
}
