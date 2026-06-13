/** Client fallback when /review API not deployed yet — mirrors @chapterai/credit adviseTradelineInclusion */
export function adviseTradelineInclusion(tl: {
  creditorName: string;
  balance: string;
  monthlyPayment?: string;
  schedule: string;
  rationale: string;
  isDuplicate?: boolean;
  isManual?: boolean;
}): { recommendation: "keep" | "exclude"; reason: string } {
  if (tl.isDuplicate) {
    return {
      recommendation: "exclude",
      reason: "Marked as duplicate — exclude from petition",
    };
  }
  if (tl.isManual) {
    return {
      recommendation: "keep",
      reason: `Manual creditor (not on credit report) — include on Schedule ${tl.schedule}`,
    };
  }
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
