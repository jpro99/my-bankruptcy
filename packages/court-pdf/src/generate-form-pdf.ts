import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CourtFormPdfInput } from "./types.js";
import {
  CONTENT_WIDTH,
  MARGIN,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  drawWatermark,
  officialFormNumber,
  wrapText,
} from "./layout.js";

const LABEL_WIDTH = 200;
const VALUE_WIDTH = CONTENT_WIDTH - LABEL_WIDTH - 12;
const LINE_HEIGHT = 14;
const FIELD_GAP = 10;

export async function generateOfficialFormPdf(input: CourtFormPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${officialFormNumber(input.formId)} — ${input.label}`);
  doc.setAuthor("ChapterAI — My Bankruptcy");
  doc.setSubject(`Bankruptcy Form ${input.formId}`);

  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  if (input.watermark) {
    drawWatermark(page, input.watermark, fontBold);
  }

  const headerLines: Array<{ text: string; size: number; bold?: boolean }> = [
    { text: "United States Bankruptcy Court", size: 10, bold: true },
    { text: input.district.toUpperCase(), size: 12, bold: true },
    { text: input.divisionName, size: 11 },
    { text: "Official Form", size: 9 },
    { text: officialFormNumber(input.formId), size: 22, bold: true },
    { text: input.label, size: 13, bold: true },
    {
      text: `In re: ${input.debtorName}  ·  Chapter ${input.chapter}  ·  CM/ECF ${input.eventCode}`,
      size: 10,
    },
  ];

  for (const line of headerLines) {
    const f = line.bold ? fontBold : font;
    page.drawText(line.text, {
      x: MARGIN,
      y,
      size: line.size,
      font: f,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= line.size + (line.size >= 20 ? 6 : 4);
  }

  y -= 12;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.75,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 18;

  if (input.fields.length === 0) {
    page.drawText("No field data yet — complete this form in Petition Prep, then regenerate.", {
      x: MARGIN,
      y,
      size: 11,
      font: fontItalic,
      color: rgb(0.35, 0.35, 0.35),
    });
  } else {
    for (const field of input.fields) {
      const labelLines = wrapText(field.label, fontBold, 10, LABEL_WIDTH);
      const valueLines = wrapText(field.value || "—", font, 10, VALUE_WIDTH);
      const rowLines = Math.max(labelLines.length, valueLines.length);
      const rowHeight = rowLines * LINE_HEIGHT + FIELD_GAP;

      if (y - rowHeight < MARGIN + 40) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
        if (input.watermark) drawWatermark(page, input.watermark, fontBold);
      }

      for (let i = 0; i < rowLines; i++) {
        const ly = y - i * LINE_HEIGHT;
        if (labelLines[i]) {
          page.drawText(labelLines[i]!, {
            x: MARGIN,
            y: ly,
            size: 10,
            font: fontBold,
            color: rgb(0.15, 0.15, 0.15),
          });
        }
        if (valueLines[i]) {
          page.drawText(valueLines[i]!, {
            x: MARGIN + LABEL_WIDTH + 12,
            y: ly,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          page.drawLine({
            start: { x: MARGIN + LABEL_WIDTH + 12, y: ly - 2 },
            end: { x: PAGE_WIDTH - MARGIN, y: ly - 2 },
            thickness: 0.35,
            color: rgb(0.55, 0.55, 0.55),
          });
        }
      }

      if (field.status && field.status !== "pending") {
        page.drawText(field.status.replace(/_/g, " ").toUpperCase(), {
          x: PAGE_WIDTH - MARGIN - 72,
          y: y - LINE_HEIGHT + 2,
          size: 7,
          font: fontItalic,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      y -= rowHeight;
    }
  }

  const footer = input.watermark ?? `Generated ${input.generatedAt ?? new Date().toISOString().slice(0, 10)}`;
  page.drawText(footer, {
    x: MARGIN,
    y: MARGIN - 8,
    size: 8,
    font: fontItalic,
    color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
}
