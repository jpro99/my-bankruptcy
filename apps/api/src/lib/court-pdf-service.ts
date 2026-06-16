import {
  generateCourtPacketPdf,
  generateOfficialFormPdf,
  type CourtFormPdfInput,
} from "@chapterai/court-pdf";
import { getCourtPacketPreview, type CourtPacketPagePreview } from "./demo-store.js";

function watermarkForPreview(practice: boolean): string | undefined {
  const efileMode = process.env.EFILE_MODE === "live" ? "live" : "sandbox";
  if (practice || efileMode === "sandbox") {
    return "PRACTICE COPY — NOT FILED";
  }
  return "PREVIEW — NOT FILED";
}

function pageToPdfInput(
  preview: ReturnType<typeof getCourtPacketPreview>,
  page: CourtPacketPagePreview
): CourtFormPdfInput {
  return {
    formId: page.formId,
    label: page.label,
    eventCode: page.eventCode,
    district: preview.district,
    divisionName: preview.divisionName,
    debtorName: preview.debtorName,
    chapter: preview.chapter,
    watermark: watermarkForPreview(!!preview.practiceMode),
    fields: page.fields.map((f) => ({
      label: f.label,
      value: f.value,
      status: f.status,
    })),
  };
}

export async function buildCourtFormPdf(
  matterId: string,
  formId: string,
  options?: { practice?: boolean }
): Promise<Uint8Array | null> {
  const preview = getCourtPacketPreview(matterId, { practice: options?.practice });
  const page = preview.pages.find((p) => p.formId === formId);
  if (!page) return null;
  return generateOfficialFormPdf(pageToPdfInput(preview, page));
}

export async function buildCourtPacketPdf(
  matterId: string,
  options?: { practice?: boolean; formIds?: string[] }
): Promise<Uint8Array> {
  const preview = getCourtPacketPreview(matterId, { practice: options?.practice });
  const pages =
    options?.formIds && options.formIds.length > 0
      ? preview.pages.filter((p) => options.formIds!.includes(p.formId))
      : preview.pages;

  if (pages.length === 0) {
    throw new Error("No court forms available for PDF export");
  }

  return generateCourtPacketPdf({
    district: preview.district,
    divisionName: preview.divisionName,
    debtorName: preview.debtorName,
    chapter: preview.chapter,
    watermark: watermarkForPreview(!!preview.practiceMode),
    pages: pages.map((page) => ({
      formId: page.formId,
      label: page.label,
      eventCode: page.eventCode,
      fields: page.fields.map((f) => ({
        label: f.label,
        value: f.value,
        status: f.status,
      })),
    })),
  });
}

export function courtPdfFilename(formId: string, debtorName: string): string {
  const safeName = debtorName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  return `Form_${formId.replace(/\//g, "-")}_${safeName || "debtor"}.pdf`;
}
