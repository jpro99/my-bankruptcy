import { FIRM } from "./firm";

const PRINT_STYLES = `
@page { margin: 0.75in; }
body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; font-size: 11pt; line-height: 1.55; max-width: 7in; margin: 0; }
.letterhead { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
.letterhead h1 { font-size: 14pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 0.35rem; }
.letterhead p { margin: 0.1rem 0; font-size: 10pt; color: #333; }
.doc-title { font-size: 12pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin: 1.25rem 0 1rem; }
.date-line { margin-bottom: 1.25rem; }
.salutation { margin-bottom: 1rem; }
p { margin: 0 0 0.85rem; }
.section-label { font-weight: 700; margin: 1.25rem 0 0.5rem; }
.review-list { margin: 0.5rem 0 1rem 1.25rem; padding: 0; }
.review-list li { margin-bottom: 0.35rem; }
.signature { margin-top: 2rem; }
.signature .name { font-weight: 700; margin: 0; }
.signature .firm { margin: 0.15rem 0 0; color: #333; }
.receipt-grid { width: 100%; border-collapse: collapse; margin: 1rem 0; }
.receipt-grid td { padding: 0.45rem 0; border-bottom: 1px solid #ddd; vertical-align: top; }
.receipt-grid td:last-child { text-align: right; font-weight: 600; }
.receipt-total td { border-top: 2px solid #1a1a1a; border-bottom: none; font-size: 12pt; padding-top: 0.65rem; }
.footer-note { margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid #ccc; font-size: 9pt; color: #555; }
`;

function letterheadHtml(): string {
  return `<div class="letterhead">
  <h1>${escapeHtml(FIRM.name)}</h1>
  <p>${escapeHtml(FIRM.address.line1)}</p>
  <p>${escapeHtml(FIRM.address.cityStateZip)}</p>
  <p>${escapeHtml(FIRM.phone)}</p>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openPrintWindow(title: string, bodyHtml: string): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>${PRINT_STYLES}</style></head><body>${bodyHtml}
<script>window.onload=function(){window.print();}</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export interface ThankYouLetterInput {
  clientName: string;
  chapter?: string;
  caseNumber?: string;
}

export function printDischargeThankYouLetter(input: ThankYouLetterInput): void {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const chapterLine =
    input.chapter != null
      ? `Congratulations on the discharge of your Chapter ${input.chapter} bankruptcy${
          input.caseNumber ? ` (Case No. ${input.caseNumber})` : ""
        }.`
      : "Congratulations on the discharge of your bankruptcy case.";

  const reviewItems: string[] = [];
  if (FIRM.reviews.googleUrl) {
    reviewItems.push(`Google: ${FIRM.reviews.googleUrl}`);
  } else {
    reviewItems.push(`Google — search for "${FIRM.name}" and leave a review`);
  }
  if (FIRM.reviews.yelpUrl) {
    reviewItems.push(`Yelp: ${FIRM.reviews.yelpUrl}`);
  } else {
    reviewItems.push(`Yelp — search for "${FIRM.shortName}" and share your experience`);
  }

  const body = `${letterheadHtml()}
<p class="date-line">${dateStr}</p>
<p class="salutation">Dear ${escapeHtml(input.clientName)},</p>
<p>${chapterLine} It has been a genuine pleasure to work with you and to serve you through this important chapter of your life. We are honored that you entrusted our office with your fresh start.</p>
<p>Please retain your discharge order and related court documents for your records. If questions arise in the future, do not hesitate to contact our office.</p>
<p class="section-label">For future reference — personal injury</p>
<p>Our firm also represents clients in personal injury matters — automobile accidents, slip and falls, workplace injuries, and related claims. Personal injury representation is entirely separate from bankruptcy. If you or someone you know was injured, we would welcome the opportunity to speak with you at ${escapeHtml(FIRM.phone)}.</p>
<p class="section-label">Your feedback</p>
<p>If you were satisfied with our service, we would be deeply grateful if you would take a moment to share your experience online:</p>
<ul class="review-list">${reviewItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
<p>Thank you again for the opportunity to serve you. We wish you every success on your fresh start.</p>
<div class="signature">
  <p class="name">Sincerely,</p>
  <p class="name">${escapeHtml(FIRM.attorneyName)}</p>
  <p class="firm">${escapeHtml(FIRM.name)}</p>
</div>`;

  openPrintWindow("Discharge Thank You Letter", body);
}

export interface PaymentReceiptPrintInput {
  clientName: string;
  matterId: string;
  chapter?: string;
  totalCharged: string;
  amountReceived: string;
  totalReceivedToDate?: string;
  balanceRemaining?: string;
  method?: string;
  checkNumber?: string;
  receivedAt?: string;
  note?: string;
}

export function printPaymentReceipt(input: PaymentReceiptPrintInput): void {
  const when = input.receivedAt
    ? new Date(input.receivedAt).toLocaleString()
    : new Date().toLocaleString();
  const serviceLabel =
    input.chapter != null
      ? `Chapter ${input.chapter} bankruptcy — legal services`
      : "Bankruptcy — legal services";

  const rows = [
    ["Client", input.clientName],
    ["Matter reference", input.matterId],
    ["Date", when],
    [serviceLabel, `$${input.totalCharged}`],
    ["Amount received (this payment)", `$${input.amountReceived}`],
  ];

  if (input.method) {
    rows.push([
      "Payment method",
      `${input.method}${input.checkNumber ? ` · Check #${input.checkNumber}` : ""}`,
    ]);
  }
  if (input.totalReceivedToDate) {
    rows.push(["Total received to date", `$${input.totalReceivedToDate}`]);
  }
  if (input.balanceRemaining != null) {
    rows.push(["Balance remaining", `$${input.balanceRemaining}`]);
  }

  const body = `${letterheadHtml()}
<p class="doc-title">Payment Receipt</p>
<table class="receipt-grid">
${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}
<tr class="receipt-total"><td>Amount received</td><td>$${escapeHtml(input.amountReceived)}</td></tr>
</table>
${input.note ? `<p><strong>Note:</strong> ${escapeHtml(input.note)}</p>` : ""}
<p class="footer-note">This receipt acknowledges payment received for legal services. Retain for your records. ${escapeHtml(FIRM.name)} — trust accounting copy.</p>`;

  openPrintWindow("Payment Receipt", body);
}
