"use client";

import Link from "next/link";
import type { CourtPacketPage, CourtPacketPreview } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<string, string> = {
  approved: "court-form-sheet__status--approved",
  edited: "court-form-sheet__status--edited",
  pending: "court-form-sheet__status--pending",
  needs_review: "court-form-sheet__status--pending",
  building: "court-form-sheet__status--building",
};

function officialFormNumber(formId: string): string {
  if (formId === "cert-counsel" || formId === "MML" || formId.startsWith("3015")) {
    return formId;
  }
  if (formId.startsWith("122")) return `122 ${formId.replace("122", "").replace("-", " ")}`.trim();
  return formId;
}

export function CourtFormSheet({
  preview,
  page,
  watermark,
  className,
}: {
  preview: Pick<CourtPacketPreview, "district" | "divisionName" | "debtorName" | "chapter">;
  page: CourtPacketPage;
  watermark?: string;
  className?: string;
}) {
  return (
    <article className={cn("court-form-sheet", className)} aria-label={`Form ${page.formId}`}>
      {watermark ? (
        <p className="court-form-sheet__watermark" aria-hidden>
          {watermark}
        </p>
      ) : null}
      <header className="court-form-sheet__header">
        <p className="court-form-sheet__court">United States Bankruptcy Court</p>
        <p className="court-form-sheet__district">{preview.district.toUpperCase()}</p>
        <p className="court-form-sheet__division">{preview.divisionName}</p>
        <div className="court-form-sheet__form-id-row">
          <span className="court-form-sheet__official">Official Form</span>
          <span className="court-form-sheet__form-num">{officialFormNumber(page.formId)}</span>
        </div>
        <h2 className="court-form-sheet__title">{page.label}</h2>
        <p className="court-form-sheet__case-meta">
          In re: <strong>{preview.debtorName}</strong> · Chapter {preview.chapter} · CM/ECF{" "}
          {page.eventCode}
        </p>
      </header>

      {page.fields.length === 0 ? (
        <p className="court-form-sheet__empty">
          This form is still building. Use <strong>{page.editLabel}</strong> to enter values, then
          refresh the preview.
        </p>
      ) : (
        <div className="court-form-sheet__fields">
          {page.fields.map((field, idx) => (
            <div key={`${field.label}-${idx}`} className="court-form-sheet__field-row">
              <label className="court-form-sheet__field-label">{field.label}</label>
              <div className="court-form-sheet__field-value-wrap">
                <span className="court-form-sheet__field-value">{field.value || "—"}</span>
                <span
                  className={cn(
                    "court-form-sheet__status",
                    STATUS_CLASS[field.status] ?? "court-form-sheet__status--pending"
                  )}
                >
                  {field.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="court-form-sheet__footer">
        <Link href={page.editHref} className="court-form-sheet__edit-link">
          {page.editLabel} →
        </Link>
      </footer>
    </article>
  );
}
