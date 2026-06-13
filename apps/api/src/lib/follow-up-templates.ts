/** Post-discharge and cross-sell templates (bankruptcy → personal injury) */

export const PI_FIRM_NAME =
  process.env.PI_FIRM_NAME?.trim() || "Russell Injury Group (demo — replace with your firm)";
export const PI_FIRM_PHONE = process.env.PI_FIRM_PHONE?.trim() || "(555) 867-5309";
export const PI_FIRM_URL =
  process.env.PI_FIRM_URL?.trim() || "https://example.com/personal-injury";

export function dischargeCongratulationsEmail(input: {
  debtorName: string;
  caseNumber?: string;
  chapter: "7" | "13";
}): { subject: string; text: string; html: string } {
  const subject = `Congratulations on your discharge — ${input.debtorName}`;
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
    "We also help people who were hurt in accidents.",
    "",
    `If you or someone you know was injured in a car crash, slip and fall, or workplace accident — ${PI_FIRM_NAME} handles personal injury cases separately from bankruptcy. There is no cost to ask whether you have a claim.`,
    PI_FIRM_PHONE ? `Call: ${PI_FIRM_PHONE}` : "",
    PI_FIRM_URL ? `Learn more: ${PI_FIRM_URL}` : "",
    "",
    "Thank you for trusting us with your fresh start.",
    "",
    "— Your bankruptcy team",
  ]
    .filter(Boolean)
    .join("\n");

  const html = text.replace(/\n/g, "<br>");

  return { subject, text, html };
}

export function piCrossSellOnlyEmail(input: {
  debtorName: string;
}): { subject: string; text: string; html: string } {
  const subject = "Were you injured before or during your financial hardship?";
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
    "— Your legal team",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text, html: text.replace(/\n/g, "<br>") };
}

export function portalInviteEmail(input: {
  clientName?: string;
  portalUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = "Your secure Client Vault — upload documents";
  const greeting = input.clientName ? `Hi ${input.clientName},` : "Hello,";
  const text = [
    greeting,
    "",
    "Your attorney set up a secure Client Vault for your bankruptcy case.",
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
    "— My Bankruptcy Client Vault",
  ].join("\n");

  return { subject, text, html: text.replace(/\n/g, "<br>") };
}
