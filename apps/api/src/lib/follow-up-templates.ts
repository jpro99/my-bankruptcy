/** Post-discharge and cross-sell templates (bankruptcy → personal injury) */

import {
  FIRM_NAME,
  FIRM_SHORT,
  PI_FIRM_NAME,
  PI_FIRM_PHONE,
  PI_FIRM_URL,
  PI_SUBTLE_LINE,
} from "./firm-brand.js";

export { PI_FIRM_NAME, PI_FIRM_PHONE, PI_FIRM_URL };

export function dischargeCongratulationsEmail(input: {
  debtorName: string;
  caseNumber?: string;
  chapter: "7" | "13";
}): { subject: string; text: string; html: string } {
  const subject = `Congratulations on your discharge — ${FIRM_SHORT}`;
  const text = [
    `Dear ${input.debtorName},`,
    "",
    `Your Chapter ${input.chapter} bankruptcy${input.caseNumber ? ` (Case ${input.caseNumber})` : ""} has reached discharge. That is a major milestone — you did the work, and relief is here.`,
    "",
    "What to keep for your records:",
    "• Discharge order (we filed a copy in your matter file)",
    "• Credit monitoring — scores often improve within 12–24 months",
    "• Keep this email for your files",
    "",
    "---",
    PI_SUBTLE_LINE,
    "",
    PI_FIRM_PHONE ? `Phone: ${PI_FIRM_PHONE}` : "",
    PI_FIRM_URL ? `Learn more: ${PI_FIRM_URL}` : "",
    "",
    "Thank you for trusting us with your fresh start.",
    "",
    `— ${FIRM_NAME}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = text.replace(/\n/g, "<br>");

  return { subject, text, html };
}

export function piCrossSellOnlyEmail(input: {
  debtorName: string;
}): { subject: string; text: string; html: string } {
  const subject = "A note from our office — personal injury";
  const text = [
    `Hi ${input.debtorName},`,
    "",
    "Now that your bankruptcy matter is wrapping up, we wanted you to know:",
    "",
    `${PI_FIRM_NAME} also represents people hurt in accidents — car crashes, falls, medical issues, and more.`,
    "",
    "Personal injury is completely separate from bankruptcy. If you think you might have a claim, reply to this email or call us — a quick conversation costs nothing.",
    PI_FIRM_PHONE ? `\nPhone: ${PI_FIRM_PHONE}` : "",
    PI_FIRM_URL ? `\n${PI_FIRM_URL}` : "",
    "",
    `— ${FIRM_NAME}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text, html: text.replace(/\n/g, "<br>") };
}

export function portalInviteEmail(input: {
  clientName?: string;
  portalUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = `${FIRM_SHORT} — your secure client portal`;
  const greeting = input.clientName ? `Dear ${input.clientName},` : "Dear Client,";
  const text = [
    greeting,
    "",
    `${FIRM_NAME} has opened a private portal for your bankruptcy matter.`,
    "",
    "Use this link from your phone or computer to:",
    "• Upload ID, pay stubs, bank statements, and tax returns",
    "• Complete required credit counseling (Course 1)",
    "• Send messages to your attorney",
    "",
    input.portalUrl,
    "",
    "This link is encrypted and private to you.",
    "",
    PI_SUBTLE_LINE,
    PI_FIRM_URL ? PI_FIRM_URL : "",
    "",
    `— ${FIRM_NAME}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text, html: text.replace(/\n/g, "<br>") };
}
