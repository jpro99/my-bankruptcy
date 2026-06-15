import {
  addIntakeDocument,
  addManualCreditor,
  addMatterNote,
  saveConsultSnapshot,
  type ScheduleBucket,
} from "./demo-store.js";

export interface ParsedTestDataCsv {
  fields: Record<string, string>;
  paystubs: Array<{ fileName: string; gross?: string }>;
  w2s: Array<{ fileName: string; wages?: string }>;
  documents: Array<{ fileName: string; documentType: string }>;
  debts: Array<{ name: string; balance: string; kind: string; accountType?: string }>;
}

export interface TestDataImportResult {
  debtorName: string;
  documentsAdded: number;
  debtsAdded: number;
  consultEvaluated: boolean;
  lines: string[];
}

/** Parse a simple field,value CSV (supports # comments and a header row). */
export function parseTestDataCsv(csvText: string): ParsedTestDataCsv {
  const fields: Record<string, string> = {};
  const paystubs: ParsedTestDataCsv["paystubs"] = [];
  const w2s: ParsedTestDataCsv["w2s"] = [];
  const documents: ParsedTestDataCsv["documents"] = [];
  const debts: ParsedTestDataCsv["debts"] = [];

  for (const rawLine of csvText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const cols = splitCsvLine(line);
    if (cols.length < 2) continue;

    const field = cols[0]!.trim().toLowerCase();
    if (field === "field" && cols[1]!.trim().toLowerCase() === "value") continue;

    if (field === "paystub") {
      paystubs.push({
        fileName: cols[1]!.trim(),
        gross: cols[2]?.trim(),
      });
      continue;
    }
    if (field === "w2") {
      w2s.push({
        fileName: cols[1]!.trim(),
        wages: cols[2]?.trim(),
      });
      continue;
    }
    if (field === "debt") {
      debts.push({
        name: cols[1]!.trim(),
        balance: normalizeMoney(cols[2]?.trim() ?? "0"),
        kind: cols[3]?.trim().toLowerCase() || "unsecured",
        accountType: cols[4]?.trim(),
      });
      continue;
    }
    if (field === "document") {
      documents.push({
        fileName: cols[1]!.trim(),
        documentType: cols[2]?.trim().toLowerCase() || inferDocType(cols[1]!.trim()),
      });
      continue;
    }

    fields[field] = cols.slice(1).join(",").trim();
  }

  return { fields, paystubs, w2s, documents, debts };
}

export function importTestDataFromCsv(matterId: string, csvText: string): TestDataImportResult {
  const parsed = parseTestDataCsv(csvText);
  const f = parsed.fields;

  const debtorName = f.debtor_name || f.debtor || "Test Debtor";
  const householdSize = parseInt(f.household_size || "1", 10) || 1;
  const chapterPref = (f.chapter === "13" ? "13" : f.chapter === "7" ? "7" : "undecided") as
    | "7"
    | "13"
    | "undecided";
  const annualIncome = normalizeMoney(f.annual_income || f.income || "0");
  const monthlyExpenses = normalizeMoney(f.monthly_expenses || f.expenses || "3200");
  const securedDebt = normalizeMoney(f.secured_debt || "0");
  const unsecuredDebt = normalizeMoney(f.unsecured_debt || "0");
  const priorBk = f.prior_bankruptcy || f.prior_bankruptcy_filing || "none";
  const employer = f.employer?.trim();
  const attorneyNotes = [
    f.attorney_notes?.trim(),
    f.notes?.trim(),
    `Test CSV import (${new Date().toISOString().slice(0, 10)})`,
    priorBk !== "none" ? `Prior bankruptcy: ${priorBk}` : undefined,
    employer ? `Employer: ${employer}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  saveConsultSnapshot(matterId, {
    debtorName,
    householdSize,
    annualIncome,
    monthlyExpenses,
    securedDebt,
    unsecuredDebt,
    chapterPreference: chapterPref,
    takeCase: "yes",
    attorneyNotes,
    evaluate: true,
  });

  let documentsAdded = 0;

  for (const ps of parsed.paystubs) {
    addIntakeDocument(matterId, {
      fileName: ps.fileName,
      documentType: "paystub",
      uploadedBy: "attorney",
      source: "test_csv",
    });
    documentsAdded += 1;
  }

  for (const w2 of parsed.w2s) {
    addIntakeDocument(matterId, {
      fileName: w2.fileName,
      documentType: "tax_return",
      uploadedBy: "attorney",
      source: "test_csv",
    });
    documentsAdded += 1;
  }

  for (const doc of parsed.documents) {
    addIntakeDocument(matterId, {
      fileName: doc.fileName,
      documentType: doc.documentType,
      uploadedBy: "attorney",
      source: "test_csv",
    });
    documentsAdded += 1;
  }

  if (f.drivers_license) {
    addIntakeDocument(matterId, {
      fileName: f.drivers_license,
      documentType: "drivers_license",
      uploadedBy: "attorney",
      source: "test_csv",
    });
    documentsAdded += 1;
  }

  let debtsAdded = 0;
  for (const debt of parsed.debts) {
    addManualCreditor(matterId, {
      creditorName: debt.name,
      balance: debt.balance,
      schedule: debtSchedule(debt.kind),
      accountType: debt.accountType || debt.kind,
    });
    debtsAdded += 1;
  }

  const summaryLines = [
    `Debtor: ${debtorName}`,
    `Income: $${annualIncome}/yr · Expenses: $${monthlyExpenses}/mo`,
    `Debts: $${securedDebt} secured · $${unsecuredDebt} unsecured`,
    `${documentsAdded} document(s) · ${debtsAdded} creditor(s) from CSV`,
  ];

  addMatterNote(matterId, {
    text: `Test data summary imported:\n${summaryLines.join("\n")}`,
    source: "system",
    authorLabel: "Test import",
  });

  return {
    debtorName,
    documentsAdded,
    debtsAdded,
    consultEvaluated: true,
    lines: summaryLines,
  };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeMoney(raw: string): string {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (!cleaned) return "0.00";
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function inferDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("license") || lower.includes("_dl") || lower.includes(" id")) {
    return "drivers_license";
  }
  if (lower.includes("pay")) return "paystub";
  if (lower.includes("w2") || lower.includes("w-2")) return "tax_return";
  if (lower.includes("bank")) return "bank_statement";
  if (lower.includes("1040") || lower.includes("tax")) return "tax_return";
  return "other";
}

function debtSchedule(kind: string): ScheduleBucket {
  const k = kind.toLowerCase();
  if (k.includes("secured") || k.includes("auto") || k.includes("mortgage") || k.includes("vehicle")) {
    return "D";
  }
  if (k.includes("priority") || k.includes("tax") || k.includes("child") || k.includes("domestic")) {
    return "E";
  }
  if (k.includes("lease") || k.includes("utility") || k.includes("rent")) {
    return "G";
  }
  return "F";
}

export const SAMPLE_TEST_DATA_CSV = `# My Bankruptcy — test data summary (CSV)
# Drop on any matter Documents tab to populate Scout, debts, paystubs, and W-2s.
field,value
debtor_name,Jeffrey Russell
household_size,2
chapter,7
annual_income,72000
monthly_expenses,3200
secured_debt,28500
unsecured_debt,12400
employer,Acme Manufacturing LLC
prior_bankruptcy,none
attorney_notes,Demo packet — replace with real client data before filing
paystub,January_2024_paystub.pdf,6000
paystub,February_2024_paystub.pdf,6000
paystub,March_2024_paystub.pdf,6000
w2,2023_W2_Acme.pdf,72000
w2,2022_W2_Acme.pdf,68500
document,jeffrey_russell_drivers_license.jpg,drivers_license
document,chase_checking_jan2024.pdf,bank_statement
document,chase_savings_jan2024.pdf,bank_statement
document,2022_1040_joint.pdf,tax_return
debt,Chase Freedom Visa,8500,unsecured,credit_card
debt,Capital One,2100,unsecured,credit_card
debt,Synchrony Amazon,1800,unsecured,store_card
debt,Wells Fargo Auto,22000,secured,auto_loan
debt,Medical Center,950,priority,medical
`;
