import type { PriorityClass } from "../schedules/schedule-e-f.js";

export type ScheduleBucket = "D" | "E" | "F" | "G";

export interface TradelineInput {
  id: string;
  creditorName: string;
  accountType: string;
  balance: string;
  monthlyPayment?: string;
  collateralDescription?: string;
  isSecured?: boolean;
  isRevolving?: boolean;
  isLease?: boolean;
  isPriority?: boolean;
  priorityClass?: PriorityClass;
}

export interface ClassifiedTradeline extends TradelineInput {
  schedule: ScheduleBucket;
  confidence: number;
  rationale: string;
}

const LEASE_KEYWORDS = [
  "lease",
  "utility",
  "telecom",
  "rental",
  "gym",
  "subscription",
  "insurance policy",
];

const SECURED_KEYWORDS = [
  "mortgage",
  "auto",
  "vehicle",
  "secured",
  "lien",
  "heloc",
  "home equity",
];

function matchesKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/**
 * Classify a tri-merge tradeline into Schedule D, E, F, or G.
 * Deterministic rules aligned with Official Form 106D/E/F/G instructions.
 */
export function classifyTradeline(input: TradelineInput): ClassifiedTradeline {
  const typeLower = input.accountType.toLowerCase();
  const nameLower = input.creditorName.toLowerCase();
  const combined = `${typeLower} ${nameLower}`;

  if (
    input.isLease ||
    matchesKeyword(combined, LEASE_KEYWORDS) ||
    (parseFloat(input.balance) === 0 && input.monthlyPayment && parseFloat(input.monthlyPayment) > 0)
  ) {
    return {
      ...input,
      schedule: "G",
      confidence: 0.94,
      rationale: "Executory contract or unexpired lease — Schedule G",
    };
  }

  if (input.isPriority && input.priorityClass) {
    return {
      ...input,
      schedule: "E",
      confidence: 0.95,
      rationale: `Priority unsecured (${input.priorityClass}) — Schedule E`,
    };
  }

  if (input.isPriority || matchesKeyword(combined, ["tax", "domestic support", "child support"])) {
    return {
      ...input,
      schedule: "E",
      confidence: 0.88,
      rationale: "Priority unsecured claim — Schedule E",
    };
  }

  if (
    input.isSecured ||
    input.collateralDescription ||
    matchesKeyword(combined, SECURED_KEYWORDS)
  ) {
    return {
      ...input,
      schedule: "D",
      confidence: 0.96,
      rationale: "Secured claim with collateral — Schedule D",
    };
  }

  return {
    ...input,
    schedule: "F",
    confidence: 0.92,
    rationale: "Nonpriority unsecured claim — Schedule F",
  };
}

export function classifyTradelines(inputs: TradelineInput[]): ClassifiedTradeline[] {
  return inputs.map(classifyTradeline);
}
