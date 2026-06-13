/** Client fallback when /review API not deployed yet — mirrors @chapterai/credit adviseTradelineInclusion */
export function adviseTradelineInclusion(tl: {
  creditorName: string;
  balance: string;
  monthlyPayment?: string;
  schedule: string;
  rationale: string;
}): { recommendation: "keep" | "exclude"; reason: string } {
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
      reason: "Ongoing monthly service — list only if surrendering/rejecting lease",
    };
  }
  if (Number.isFinite(balance) && balance <= 0 && tl.schedule !== "G") {
    return {
      recommendation: "exclude",
      reason: "Zero balance — no claim to list on schedules",
    };
  }
  return {
    recommendation: "keep",
    reason: `Include on Schedule ${tl.schedule} — ${tl.rationale}`,
  };
}
