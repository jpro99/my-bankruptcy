"use client";

import { FileText, X } from "lucide-react";
import type { ReviewField } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewModalProps {
  field: ReviewField;
  onClose: () => void;
  onApprove?: () => void;
}

/** Demo source-document preview — real product would load encrypted PDF from storage */
function demoDocumentBody(field: ReviewField): {
  title: string;
  lines: string[];
  highlight: string;
} {
  const name = field.sourceDocument?.fileName?.toLowerCase() ?? "";
  const value = String(field.proposedValue);

  if (name.includes("paystub") || name.includes("pay_stub")) {
    return {
      title: "ADP Pay Statement — January 2025",
      lines: [
        "Employer: Riverside Medical Group",
        "Employee: Maria Martinez",
        "Pay period: 01/01/2025 – 01/15/2025",
        `Gross pay (this period): $3,000.00`,
        `Gross pay (YTD): $3,000.00`,
        "Deductions: Federal tax, CA tax, medical",
        `Net pay: $2,142.18`,
      ],
      highlight: value.includes(".") ? `$${value}` : value,
    };
  }

  if (name.includes("license") || name.includes("drivers")) {
    return {
      title: "California Driver License (OCR extract)",
      lines: [
        "State: California",
        "Class: C",
        `Name: Maria Martinez`,
        "Address: 1234 Oak Ave, Los Angeles CA",
        "DOB: **/**/1985",
        "Exp: 08/2027",
      ],
      highlight: value,
    };
  }

  if (name.includes("credit")) {
    return {
      title: "Tri-Merge Credit Report (excerpt)",
      lines: [
        "Bureau: Equifax / Experian / TransUnion",
        "Subject: Maria Martinez",
        `Tradeline: ${value}`,
        "Status: Open",
        "Account type: Revolving",
      ],
      highlight: value,
    };
  }

  if (name.includes("property") || name.includes("tax")) {
    return {
      title: "Property Tax Statement — Fresno County",
      lines: [
        "Parcel: 123-456-789",
        "Owner: Maria Martinez",
        "Site address: 1234 Oak Ave",
        `Assessed value: $${value}`,
        "Tax year: 2024",
      ],
      highlight: `$${value}`,
    };
  }

  if (name.includes("bank")) {
    return {
      title: "Bank Statement — December 2024",
      lines: [
        "Institution: Chase Bank",
        "Account: ****3344",
        "Recurring payment detected",
        `Payee: ${value}`,
      ],
      highlight: value,
    };
  }

  return {
    title: field.sourceDocument?.fileName ?? "Source document",
    lines: [
      `Extracted field: ${field.fieldPath}`,
      `AI proposed value: ${value}`,
      field.rationale ?? "No additional context.",
    ],
    highlight: value,
  };
}

export function DocumentPreviewModal({ field, onClose, onApprove }: DocumentPreviewModalProps) {
  const doc = demoDocumentBody(field);
  const fileName = field.sourceDocument?.fileName ?? "document.pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-elevated animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="doc-preview-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-muted">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <h2 id="doc-preview-title" className="font-display text-lg font-bold">
                Source Document
              </h2>
              <p className="text-xs text-muted-foreground">{fileName}</p>
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline">Form {field.formId}</Badge>
            <Badge variant="secondary">{field.fieldPath}</Badge>
          </div>

          <div className="rounded-xl border border-border bg-slate-50 p-6 font-mono text-sm shadow-inner">
            <p className="mb-4 border-b border-border pb-3 font-sans text-base font-bold text-foreground">
              {doc.title}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              {doc.lines.map((line) => (
                <li
                  key={line}
                  className={
                    line.includes(doc.highlight) || line.endsWith(doc.highlight)
                      ? "rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-950"
                      : undefined
                  }
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Yellow highlight = the value AI extracted for this field. Compare to the source, then
            approve or edit.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 px-6 py-4">
          {onApprove && field.approvalState === "pending" && (
            <Button
              variant="success"
              className="flex-1 sm:flex-none"
              onClick={() => {
                onApprove();
                onClose();
              }}
            >
              Looks correct — Approve
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
