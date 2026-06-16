import { PDFFont, PDFPage, degrees, rgb } from "pdf-lib";

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;
export const MARGIN = 54;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function officialFormNumber(formId: string): string {
  if (formId === "cert-counsel" || formId === "MML" || formId === "341") return formId;
  if (formId.startsWith("3015")) return `CACB ${formId}`;
  if (formId.startsWith("122")) return `B ${formId}`;
  if (formId.match(/^\d/)) return `B ${formId}`;
  return formId;
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (words.length === 0 || words[0] === "") return ["—"];

  const lines: string[] = [];
  let line = words[0] ?? "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i]!;
    const test = `${line} ${word}`;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

export function drawWatermark(page: PDFPage, text: string, font: PDFFont): void {
  const size = 28;
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: PAGE_WIDTH / 2 - textWidth / 2,
    y: PAGE_HEIGHT / 2,
    size,
    font,
    color: rgb(0.75, 0.45, 0.15),
    rotate: degrees(-24),
    opacity: 0.12,
  });
}
