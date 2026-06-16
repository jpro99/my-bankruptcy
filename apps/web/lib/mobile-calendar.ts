/** Google Calendar + Gmail deep links — bankruptcy matter events (not generic CRM) */

export type BankruptcyEventKind =
  | "consult"
  | "follow_up"
  | "document_deadline"
  | "credit_counseling"
  | "filing_target"
  | "meeting_341"
  | "court_hearing"
  | "fee_payment";

export const BANKRUPTCY_EVENT_TEMPLATES: Record<
  BankruptcyEventKind,
  { label: string; defaultTitle: (debtor: string) => string; defaultDetails: (debtor: string, matterId: string) => string; defaultDurationMin: number }
> = {
  consult: {
    label: "Initial consult",
    defaultTitle: (d) => `BK consult — ${d}`,
    defaultDetails: (d, id) =>
      `Bankruptcy initial consultation — ${d}\nMatter: ${id}\nEdgar P. Lombera · Field capture`,
    defaultDurationMin: 60,
  },
  follow_up: {
    label: "Client follow-up",
    defaultTitle: (d) => `Follow-up — ${d} (bankruptcy)`,
    defaultDetails: (d, id) => `Follow-up call re Ch 7/13 intake\nMatter: ${id}`,
    defaultDurationMin: 30,
  },
  document_deadline: {
    label: "Documents due",
    defaultTitle: (d) => `Docs due — ${d}`,
    defaultDetails: (d, id) =>
      `Client document deadline (paystubs, ID, tax returns)\nMatter: ${id}\nClient portal upload`,
    defaultDurationMin: 15,
  },
  credit_counseling: {
    label: "Credit counseling due",
    defaultTitle: (d) => `Course 1 due — ${d}`,
    defaultDetails: (d, id) =>
      `BAPCPA credit counseling (before filing)\nMatter: ${id}\nCredit counseling`,
    defaultDurationMin: 30,
  },
  filing_target: {
    label: "Target filing date",
    defaultTitle: (d) => `Target filing — ${d}`,
    defaultDetails: (d, id) => `Petition filing target\nMatter: ${id}\nPetition prep → E-file`,
    defaultDurationMin: 120,
  },
  meeting_341: {
    label: "341 meeting of creditors",
    defaultTitle: (d) => `341 meeting — ${d}`,
    defaultDetails: (d, id) =>
      `Meeting of creditors (11 U.S.C. §341)\nMatter: ${id}\nBring ID · arrive 15 min early`,
    defaultDurationMin: 60,
  },
  court_hearing: {
    label: "Court hearing",
    defaultTitle: (d) => `Court — ${d}`,
    defaultDetails: (d, id) => `Bankruptcy court appearance\nMatter: ${id}`,
    defaultDurationMin: 60,
  },
  fee_payment: {
    label: "Fee / retainer due",
    defaultTitle: (d) => `Fee due — ${d}`,
    defaultDetails: (d, id) => `Fees & trust payment / retainer\nMatter: ${id}`,
    defaultDurationMin: 15,
  },
};

function formatGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  start: Date;
  durationMin?: number;
  details?: string;
  location?: string;
}): string {
  const end = new Date(input.start.getTime() + (input.durationMin ?? 60) * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${formatGoogleDate(input.start)}/${formatGoogleDate(end)}`,
    details: input.details ?? "",
    location: input.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildGmailComposeUrl(input: {
  to?: string;
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: input.subject,
    body: input.body,
  });
  if (input.to) params.set("to", input.to);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export type BankruptcyEmailKind =
  | "welcome"
  | "documents_request"
  | "portal_link"
  | "341_reminder"
  | "fee_reminder";

export const BANKRUPTCY_EMAIL_TEMPLATES: Record<
  BankruptcyEmailKind,
  { label: string; subject: (debtor: string) => string; body: (debtor: string, matterId: string, extra?: string) => string }
> = {
  welcome: {
    label: "Welcome — next steps",
    subject: (d) => `Your bankruptcy intake — ${d}`,
    body: (d, id) =>
      `Hi ${d},\n\nThank you for choosing our office for your bankruptcy matter.\n\nNext steps:\n1. Complete the secure client portal upload (ID, pay stubs, bank statements)\n2. Complete credit counseling (Course 1) before we file\n\nMatter reference: ${id}\n\nWe will be in touch shortly.\n\n— Your bankruptcy attorney`,
  },
  documents_request: {
    label: "Request documents",
    subject: (d) => `Documents needed — ${d}`,
    body: (d) =>
      `Hi ${d},\n\nPlease upload the following to your secure client portal link:\n• Photo ID\n• Pay stubs (last 60 days)\n• Bank statements (last 3 months)\n• Tax returns (last 2 years)\n\nReply if you have questions.\n\n— Your bankruptcy attorney`,
  },
  portal_link: {
    label: "Send client portal link",
    subject: (d) => `Secure upload link — ${d}`,
    body: (d, _id, extra) =>
      `Hi ${d},\n\nUse your encrypted client portal to upload documents from your phone:\n\n${extra ?? "[Client portal link will be pasted here]"}\n\nThis link is private to you.\n\n— Your bankruptcy attorney`,
  },
  "341_reminder": {
    label: "341 meeting reminder",
    subject: (d) => `341 meeting reminder — ${d}`,
    body: (d, id, extra) =>
      `Hi ${d},\n\nReminder: your Meeting of Creditors (341) is scheduled.\n\n${extra ?? "Date/time: [add from calendar]"}\n\nBring government-issued photo ID. Arrive 15 minutes early.\n\nMatter: ${id}\n\n— Your bankruptcy attorney`,
  },
  fee_reminder: {
    label: "Fee reminder",
    subject: (d) => `Fee balance — ${d}`,
    body: (d) =>
      `Hi ${d},\n\nThis is a friendly reminder regarding your bankruptcy fee balance.\n\nPlease contact our office to arrange payment (cash, check, card, or Zelle).\n\n— Your bankruptcy attorney`,
  },
};

export function downloadIcsFile(input: {
  title: string;
  start: Date;
  durationMin?: number;
  details?: string;
  uid?: string;
}): void {
  const end = new Date(input.start.getTime() + (input.durationMin ?? 60) * 60_000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
  const uid = input.uid ?? `${Date.now()}@my-bankruptcy.app`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Edgar P. Lombera//Bankruptcy Field Capture//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(input.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${input.title.replace(/,/g, "\\,")}`,
    input.details ? `DESCRIPTION:${input.details.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${input.title.slice(0, 40).replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
