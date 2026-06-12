import {
  classifyTradeline,
  type ClassifiedTradeline,
  type ScheduleBucket,
} from "@chapterai/forms";
import type { CreditTradeline } from "./types.js";

export function classifyCreditTradelines(
  tradelines: CreditTradeline[]
): ClassifiedTradeline[] {
  return tradelines.map((tl) =>
    classifyTradeline({
      id: tl.id,
      creditorName: tl.creditorName,
      accountType: tl.accountType,
      balance: tl.balance,
      monthlyPayment: tl.monthlyPayment,
      collateralDescription: tl.collateralDescription,
      isSecured: tl.isSecured,
      isRevolving: tl.isRevolving,
      isLease: tl.isLease,
      isPriority: tl.isPriority,
      priorityClass: tl.priorityClass,
    })
  );
}

export function groupBySchedule(
  classified: ClassifiedTradeline[]
): Record<ScheduleBucket, ClassifiedTradeline[]> {
  return {
    D: classified.filter((t) => t.schedule === "D"),
    E: classified.filter((t) => t.schedule === "E"),
    F: classified.filter((t) => t.schedule === "F"),
    G: classified.filter((t) => t.schedule === "G"),
  };
}

export function scheduleSummary(classified: ClassifiedTradeline[]): {
  scheduleD: number;
  scheduleE: number;
  scheduleF: number;
  scheduleG: number;
  totalSecured: string;
  totalPriority: string;
  totalUnsecured: string;
} {
  const groups = groupBySchedule(classified);
  const sum = (items: ClassifiedTradeline[]) =>
    items.reduce((acc, t) => acc + parseFloat(t.balance), 0).toFixed(2);

  return {
    scheduleD: groups.D.length,
    scheduleE: groups.E.length,
    scheduleF: groups.F.length,
    scheduleG: groups.G.length,
    totalSecured: sum(groups.D),
    totalPriority: sum(groups.E),
    totalUnsecured: sum(groups.F),
  };
}
