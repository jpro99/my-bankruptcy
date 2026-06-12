"use client";

import { useEffect, useState } from "react";
import { calculatePlan, type PlanFeasibilityResult } from "@/lib/api-client";

export function Ch13PlanBuilder({ matterId }: { matterId: string }) {
  const [plan, setPlan] = useState<PlanFeasibilityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void calculatePlan(matterId).then((r) => {
      setPlan(r);
      setLoading(false);
    });
  }, [matterId]);

  if (loading) return <p className="text-sm text-gray-500">Calculating CACB F 3015-1.01 plan…</p>;
  if (!plan) return <p className="text-sm text-red-500">Plan calculation failed</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Chapter 13 Plan</h1>
        <p className="text-sm text-gray-500">CACB F 3015-1.01 — auto-calculated from schedules + means test</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Monthly Payment" value={`$${plan.payments.totalMonthlyPlanPayment}`} highlight />
        <Stat label="Plan Length" value={`${plan.payments.planLengthMonths} months`} />
        <Stat label="Secured (direct)" value={`$${plan.payments.securedDirectPayments}`} />
        <Stat label="Priority" value={`$${plan.payments.priorityPayments}`} />
        <Stat label="Unsecured pool" value={`$${plan.payments.unsecuredPool}`} />
        <Stat label="Trustee fee" value={`$${plan.payments.trusteeFee}`} />
      </div>

      <div
        className={`rounded-lg p-4 border ${
          plan.bestInterest.passes ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        }`}
      >
        <h3 className="font-semibold text-sm uppercase tracking-wide mb-2">
          Best Interest Test — §1325(a)(4)
        </h3>
        <p className="text-sm">{plan.bestInterest.rationale}</p>
      </div>

      <p className="text-sm font-medium text-blue-700">{plan.recommendation}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-blue-700" : ""}`}>{value}</p>
    </div>
  );
}
