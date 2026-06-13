import type { ClassifiedTradeline } from "@chapterai/forms";

export type TradelineRecommendation = "keep" | "exclude";

export interface TradelineReviewAdvice {
  recommendation: TradelineRecommendation;
  reason: string;
}

/** Attorney-facing guidance — deterministic, not LLM */
export function adviseTradelineInclusion(tl: ClassifiedTradeline): TradelineReviewAdvice {
  const balance = parseFloat(tl.balance);
  const monthly = parseFloat(tl.monthlyPayment ?? "0");

  if (tl.schedule === "G" && balance === 0 && monthly === 0) {
    return {
      recommendation: "exclude",
      reason: "Zero-balance utility or service — usually omit unless rejecting the contract",
    };
  }

  if (tl.schedule === "G" && balance === 0 && monthly > 0) {
    return {
      recommendation: "exclude",
      reason: "Ongoing monthly service — keep paying; list only if surrendering/rejecting lease",
    };
  }

  if (Number.isFinite(balance) && balance <= 0 && tl.schedule !== "G") {
    return {
      recommendation: "exclude",
      reason: "Zero balance — no claim to list on schedules",
    };
  }

  if (tl.creditorName.toLowerCase().includes("duplicate")) {
    return {
      recommendation: "exclude",
      reason: "Possible duplicate tradeline — verify before listing",
    };
  }

  return {
    recommendation: "keep",
    reason: `Include on Schedule ${tl.schedule} — ${tl.rationale}`,
  };
}
