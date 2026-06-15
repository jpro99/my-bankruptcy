/** Firm identity for outbound email (mirrors apps/web/lib/firm.ts) */

export const FIRM_NAME = process.env.FIRM_NAME?.trim() || "The Law Offices of Edgar P Lambera";
export const FIRM_SHORT = process.env.FIRM_SHORT?.trim() || "Edgar P Lambera";

export const PI_FIRM_NAME = process.env.PI_FIRM_NAME?.trim() || FIRM_NAME;
export const PI_FIRM_PHONE = process.env.PI_FIRM_PHONE?.trim() || "(555) 555-0199";
export const PI_FIRM_URL =
  process.env.PI_FIRM_URL?.trim() ||
  `${process.env.WEB_URL?.replace(/\/$/, "") || "https://my-bankruptcy.vercel.app"}/personal-injury`;

export const PI_SUBTLE_LINE =
  "If you were hurt in an accident, we also handle personal injury — ask us anytime.";
