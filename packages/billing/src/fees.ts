import type { BillingChapter, FeePackage, GenerateInvoiceInput, MatterInvoice, PaymentReceipt, RecordPaymentInput } from "./types.js";

/** California consumer bankruptcy flat-fee packages (sandbox defaults) */
export const FEE_PACKAGES: FeePackage[] = [
  {
    id: "ch7-standard",
    chapter: "7",
    label: "Chapter 7 — Standard",
    flatFee: "2500.00",
    courtFilingFee: "338.00",
    creditReportFee: "45.00",
    counselingFee: "25.00",
    description: "No-look fee for straightforward Ch 7 individual (CACB)",
  },
  {
    id: "ch7-complex",
    chapter: "7",
    label: "Chapter 7 — Complex",
    flatFee: "3500.00",
    courtFilingFee: "338.00",
    creditReportFee: "45.00",
    counselingFee: "25.00",
    description: "Business debt, high asset, or §707(b) issues",
  },
  {
    id: "ch13-standard",
    chapter: "13",
    label: "Chapter 13 — Standard",
    flatFee: "4000.00",
    courtFilingFee: "313.00",
    creditReportFee: "45.00",
    counselingFee: "25.00",
    description: "Plan confirmation through discharge (typical wage earner)",
  },
  {
    id: "ch13-complex",
    chapter: "13",
    label: "Chapter 13 — Complex",
    flatFee: "5500.00",
    courtFilingFee: "313.00",
    creditReportFee: "45.00",
    counselingFee: "25.00",
    description: "Cramdown, lien strip, or business income",
  },
];

export function getFeePackages(chapter?: BillingChapter): FeePackage[] {
  if (!chapter) return FEE_PACKAGES;
  return FEE_PACKAGES.filter((p) => p.chapter === chapter);
}

export function getFeePackage(id: string): FeePackage | undefined {
  return FEE_PACKAGES.find((p) => p.id === id);
}

function addMoney(...amounts: string[]): string {
  const total = amounts.reduce((acc, a) => acc + parseFloat(a), 0);
  return total.toFixed(2);
}

function subtractMoney(a: string, b: string): string {
  return Math.max(0, parseFloat(a) - parseFloat(b)).toFixed(2);
}

export function generateInvoice(input: GenerateInvoiceInput): MatterInvoice {
  const defaultPackageId = input.chapter === "13" ? "ch13-standard" : "ch7-standard";
  const pkg = getFeePackage(input.packageId ?? defaultPackageId)!;

  const lines = [
    {
      id: "attorney-fee",
      description: pkg.label,
      amount: pkg.flatFee,
      category: "attorney" as const,
      paid: false,
    },
    {
      id: "court-fee",
      description: "U.S. Bankruptcy Court filing fee",
      amount: pkg.courtFilingFee,
      category: "court" as const,
      paid: false,
    },
    {
      id: "credit-report",
      description: "Tri-merge credit report",
      amount: pkg.creditReportFee,
      category: "third_party" as const,
      paid: false,
    },
    {
      id: "counseling",
      description: "Credit counseling & debtor education",
      amount: pkg.counselingFee,
      category: "third_party" as const,
      paid: false,
    },
  ];

  const subtotal = addMoney(...lines.map((l) => l.amount));
  const paidAmount = input.paidAmount ?? "0.00";
  const balanceDue = subtractMoney(subtotal, paidAmount);

  let status: MatterInvoice["status"] = "draft";
  if (parseFloat(paidAmount) > 0 && parseFloat(balanceDue) > 0) status = "partial";
  if (parseFloat(balanceDue) === 0 && parseFloat(paidAmount) > 0) status = "paid";

  return {
    matterId: input.matterId,
    chapter: input.chapter,
    packageId: pkg.id,
    lines,
    subtotal,
    paidAmount,
    balanceDue,
    status,
    trustBalance: input.trustBalance ?? paidAmount,
    generatedAt: new Date().toISOString(),
    payments: [],
  };
}

export function recordPayment(
  invoice: MatterInvoice,
  amountOrInput: string | RecordPaymentInput
): MatterInvoice {
  const input: RecordPaymentInput =
    typeof amountOrInput === "string"
      ? { amount: amountOrInput, method: "other", receivedBy: "Attorney" }
      : amountOrInput;
  const amount = input.amount;
  const newPaid = addMoney(invoice.paidAmount, amount);
  const balanceDue = subtractMoney(invoice.subtotal, newPaid);
  let status: MatterInvoice["status"] = "partial";
  if (parseFloat(balanceDue) === 0) status = "paid";
  const receipt: PaymentReceipt = {
    id: crypto.randomUUID(),
    matterId: invoice.matterId,
    amount: parseFloat(amount).toFixed(2),
    method: input.method,
    checkNumber: input.checkNumber,
    note: input.note,
    receivedAt: new Date().toISOString(),
    receivedBy: input.receivedBy ?? "Attorney",
  };
  return {
    ...invoice,
    paidAmount: newPaid,
    balanceDue,
    status,
    trustBalance: addMoney(invoice.trustBalance, amount),
    payments: [...(invoice.payments ?? []), receipt],
  };
}
