import { PDFDocument } from "pdf-lib";
import type { CourtPacketPdfInput } from "./types.js";
import { generateOfficialFormPdf } from "./generate-form-pdf.js";

export async function generateCourtPacketPdf(input: CourtPacketPdfInput): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  merged.setTitle(`Bankruptcy court packet — ${input.debtorName}`);
  merged.setAuthor("ChapterAI — My Bankruptcy");

  const generatedAt = new Date().toISOString().slice(0, 10);

  for (const page of input.pages) {
    const single = await generateOfficialFormPdf({
      formId: page.formId,
      label: page.label,
      eventCode: page.eventCode,
      district: input.district,
      divisionName: input.divisionName,
      debtorName: input.debtorName,
      chapter: input.chapter,
      fields: page.fields,
      watermark: input.watermark,
      generatedAt,
    });
    const loaded = await PDFDocument.load(single);
    const copied = await merged.copyPages(loaded, loaded.getPageIndices());
    for (const p of copied) merged.addPage(p);
  }

  return merged.save();
}
