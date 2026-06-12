export type ApprovalState = "pending" | "approved" | "edited" | "questioned";

export interface ReviewField {
  id: string;
  fieldPath: string;
  formId: string;
  proposedValue: unknown;
  confidence: number;
  approvalState: ApprovalState;
  sourceDocument?: {
    id: string;
    fileName: string;
    boundingBox?: { page: number; x: number; y: number; width: number; height: number };
  };
  rationale?: string;
}

export interface MatterDiagnostics {
  missingFields: number;
  exemptionGaps: number;
  meansTestStatus: "pass" | "fail" | "review";
  presumptionOfAbuse: boolean;
  chapterRecommendation: "7" | "13" | "review";
  recommendationRationale: string;
}

export const DEMO_REVIEW_FIELDS: ReviewField[] = [
  {
    id: "f1",
    fieldPath: "debtor1.firstName",
    formId: "101",
    proposedValue: "Maria",
    confidence: 0.98,
    approvalState: "pending",
    sourceDocument: { id: "d1", fileName: "drivers_license.pdf" },
    rationale: "Extracted from California driver's license OCR",
  },
  {
    id: "f2",
    fieldPath: "debtor1.lastName",
    formId: "101",
    proposedValue: "Martinez",
    confidence: 0.98,
    approvalState: "pending",
    sourceDocument: { id: "d1", fileName: "drivers_license.pdf" },
  },
  {
    id: "f3",
    fieldPath: "realProperty.0.currentValue",
    formId: "106A/B",
    proposedValue: "685000.00",
    confidence: 0.91,
    approvalState: "pending",
    sourceDocument: {
      id: "d2",
      fileName: "property_tax_statement.pdf",
      boundingBox: { page: 1, x: 0.15, y: 0.42, width: 0.3, height: 0.04 },
    },
    rationale: "Assessed value from Fresno County property tax statement",
  },
  {
    id: "f4",
    fieldPath: "debtor1MonthlyIncome",
    formId: "106I",
    proposedValue: "6000.00",
    confidence: 0.94,
    approvalState: "pending",
    sourceDocument: { id: "d3", fileName: "paystub_jan_2025.pdf" },
    rationale: "Gross monthly from ADP paystub, averaged over 2 pay periods",
  },
  {
    id: "f5",
    fieldPath: "creditors.0.creditorName",
    formId: "106E/F",
    proposedValue: "Capital One Bank",
    confidence: 0.87,
    approvalState: "pending",
    sourceDocument: { id: "d4", fileName: "bank_statement_dec_2024.pdf" },
    rationale: "Recurring payment identified in bank statement analysis",
  },
  {
    id: "f6",
    fieldPath: "exemptionSystemUsed",
    formId: "106C",
    proposedValue: "system2",
    confidence: 0.96,
    approvalState: "pending",
    rationale: "System 2 (CCP §703.140) protects $22,150 more in assets than System 1",
  },
];

export const DEMO_DIAGNOSTICS: MatterDiagnostics = {
  missingFields: 3,
  exemptionGaps: 0,
  meansTestStatus: "pass",
  presumptionOfAbuse: false,
  chapterRecommendation: "7",
  recommendationRationale:
    "Current monthly income ($6,000/mo) is below California median ($7,764/mo) for household of 2. No presumption of abuse.",
};
