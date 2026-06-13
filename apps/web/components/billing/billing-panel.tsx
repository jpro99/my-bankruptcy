"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBilling,
  recordBillingPayment,
  type MatterInvoice,
} from "@/lib/api-client";

export function BillingPanel({ matterId }: { matterId: string }) {
  const [invoice, setInvoice] = useState<MatterInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBilling(matterId);
      setInvoice(data.invoice);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePayment = async () => {
    const amount = prompt("Payment amount:", "500.00");
    if (!amount) return;
    const data = await recordBillingPayment(matterId, amount);
    setInvoice(data.invoice);
  };

  if (loading || !invoice) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading billing…</p>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <header>
        <h1 className="text-2xl font-bold">Fees & Trust</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Chapter {invoice.chapter} · Status: {invoice.status}
        </p>
      </header>

      <ul className="space-y-2">
        {invoice.lines.map((line) => (
          <li
            key={line.id}
            className="flex justify-between text-sm py-2 border-b border-[var(--border)]"
          >
            <span>{line.description}</span>
            <span className="font-medium">${line.amount}</span>
          </li>
        ))}
      </ul>

      <div className="bg-[var(--muted)] rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">${invoice.subtotal}</span>
        </div>
        <div className="flex justify-between text-green-700">
          <span>Paid</span>
          <span>${invoice.paidAmount}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Balance due</span>
          <span>${invoice.balanceDue}</span>
        </div>
        <div className="flex justify-between text-[var(--muted-foreground)]">
          <span>Trust balance</span>
          <span>${invoice.trustBalance}</span>
        </div>
      </div>

      {parseFloat(invoice.balanceDue) > 0 && (
        <button
          type="button"
          onClick={() => void handlePayment()}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Record client payment
        </button>
      )}
    </div>
  );
}
