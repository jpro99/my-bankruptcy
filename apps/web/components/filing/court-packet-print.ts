import type { CourtPacketPreview } from "@/lib/api-client";

export function printCourtPacketPages(
  preview: CourtPacketPreview,
  pageIndexes?: number[]
) {
  const indexes =
    pageIndexes ??
    preview.pages.map((_, i) => i);
  const selected = indexes.map((i) => preview.pages[i]).filter(Boolean);

  const pageHtml = selected
    .map(
      (page) => `
<section class="page">
  <header>
    <p class="court">United States Bankruptcy Court · ${preview.district.toUpperCase()}</p>
    <h2>Form ${page!.formId} — ${page!.label}</h2>
    <p class="meta">Chapter ${preview.chapter} · ${preview.debtorName} · ${preview.divisionName}</p>
  </header>
  <table>
    <thead><tr><th>Field</th><th>Value</th><th>Status</th></tr></thead>
    <tbody>
      ${
        page!.fields.length === 0
          ? "<tr><td colspan=3><em>Still building — approve fields or sync documents.</em></td></tr>"
          : page!.fields
              .map(
                (f) =>
                  `<tr><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.value)}</td><td>${escapeHtml(f.status)}</td></tr>`
              )
              .join("")
      }
    </tbody>
  </table>
  <p class="foot">Preview only — official PDF generation before e-file</p>
</section>`
    )
    .join('<div class="page-break"></div>');

  const html = `<!DOCTYPE html><html><head><title>Court packet — ${escapeHtml(preview.debtorName)}</title>
<style>
  body{font-family:Georgia,serif;margin:0;padding:24px;color:#111;background:#fff}
  .page{max-width:720px;margin:0 auto 32px}
  .court{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:0}
  h2{font-size:18px;margin:8px 0 4px}
  .meta{font-size:12px;color:#444;margin:0 0 16px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f4f4f4;font-weight:600}
  .foot{font-size:10px;color:#888;margin-top:12px}
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
