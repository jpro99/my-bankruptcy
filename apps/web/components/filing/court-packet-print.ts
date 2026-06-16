import type { CourtPacketPreview } from "@/lib/api-client";

export function printCourtPacketPages(
  preview: CourtPacketPreview,
  pageIndexes?: number[]
) {
  const indexes =
    pageIndexes ??
    preview.pages.map((_, i) => i);
  const selected = indexes.map((i) => preview.pages[i]).filter(Boolean);
  const watermark = preview.practiceMode || preview.liveFilingBlocked
    ? "PRACTICE COPY — NOT FILED"
    : "PREVIEW — NOT FILED";

  const pageHtml = selected
    .map(
      (page) => `
<section class="page">
  <p class="watermark">${watermark}</p>
  <header>
    <p class="court">United States Bankruptcy Court</p>
    <p class="district">${escapeHtml(preview.district.toUpperCase())}</p>
    <p class="division">${escapeHtml(preview.divisionName)}</p>
    <p class="official">Official Form <span class="form-num">${escapeHtml(page!.formId)}</span></p>
    <h2>${escapeHtml(page!.label)}</h2>
    <p class="meta">In re: <strong>${escapeHtml(preview.debtorName)}</strong> · Chapter ${preview.chapter} · CM/ECF ${escapeHtml(page!.eventCode)}</p>
  </header>
  <div class="fields">
    ${
      page!.fields.length === 0
        ? `<p class="empty">Still building — edit on ${escapeHtml(page!.editLabel)}.</p>`
        : page!.fields
            .map(
              (f) =>
                `<div class="field-row"><span class="label">${escapeHtml(f.label)}</span><span class="value">${escapeHtml(f.value || "—")}</span><span class="status">${escapeHtml(f.status)}</span></div>`
            )
            .join("")
    }
  </div>
  <p class="foot">${watermark}</p>
</section>`
    )
    .join('<div class="page-break"></div>');

  const html = `<!DOCTYPE html><html><head><title>Court packet — ${escapeHtml(preview.debtorName)}</title>
<style>
  body{font-family:"Times New Roman",Times,Georgia,serif;margin:0;padding:24px;color:#111;background:#fff}
  .page{position:relative;max-width:720px;margin:0 auto 32px;padding:32px 40px;border:1px solid #ccc}
  .watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;letter-spacing:.1em;color:rgba(180,80,0,.12);transform:rotate(-24deg);pointer-events:none}
  .court{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin:0}
  .district{font-size:13px;font-weight:700;margin:4px 0 0}
  .division{font-size:12px;margin:2px 0 0;color:#333}
  .official{font-size:11px;text-transform:uppercase;margin:16px 0 0;color:#555}
  .form-num{font-size:24px;font-weight:700;text-transform:none;letter-spacing:0}
  h2{font-size:16px;margin:8px 0 0}
  .meta{font-size:12px;color:#444;margin:8px 0 20px}
  .fields{display:flex;flex-direction:column;gap:8px}
  .field-row{display:grid;grid-template-columns:38% 1fr;gap:12px;font-size:12px;border-bottom:1px dotted #ccc;padding-bottom:6px}
  .label{font-weight:600}
  .value{border-bottom:1px solid #111;min-height:16px;word-break:break-word}
  .status{grid-column:2;font-size:9px;text-transform:uppercase;color:#666;font-family:system-ui,sans-serif}
  .empty{font-size:13px;color:#555}
  .foot{font-size:10px;color:#888;margin-top:16px;border-top:1px solid #ddd;padding-top:8px}
  .page-break{page-break-after:always;height:0}
  @media print{.page-break{page-break-after:always}}
</style></head><body>
${pageHtml}
<script>window.onload=()=>window.print()</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
