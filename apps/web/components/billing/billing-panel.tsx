"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Loader2, Printer, Wallet } from "lucide-react";
import {
  fetchBilling,
  recordBillingPayment,
  type MatterInvoice,
  type PaymentReceipt,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "trust", label: "Trust transfer" },
  { value: "other", label: "Other" },
];

function printReceipt(receipt: PaymentReceipt, invoice: MatterInvoice) {
  const html = `<!DOCTYPE html><html><head><title>Payment Receipt</title>
<style>body{font-family:Georgia,serif;max-width:480px;margin:2rem auto;padding:1rem}
h1{font-size:1.25rem}.row{display:flex;justify-content:space-between;margin:0.5rem 0}
.footer{margin-top:2rem;font-size:0.75rem;color:#666;border-top:1px solid #ccc;padding-top:1rem}
</style></head><body>
<h1>${BRAND.name} — Payment Receipt</h1>
<p>Trust / fee receipt for matter ${invoice.matterId}</p>
<div class="row"><span>Amount</span><strong>$${receipt.amount}</strong></div>
<div class="row"><span>Method</span><span>${receipt.method}${receipt.checkNumber ? ` #${receipt.checkNumber}` : ""}</span></div>
<div class="row"><span>Date</span><span>${new Date(receipt.receivedAt).toLocaleString()}</span></div>
<div class="row"><span>Received by</span><span>${receipt.receivedBy}</span></div>
<div class="row"><span>Balance remaining</span><span>$${invoice.balanceDue}</span></div>
${receipt.note ? `<p>Note: ${receipt.note}</p>` : ""}
<div class="footer">Attorney copy — retain for trust accounting records.</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.print();
}

export function BillingPanel({ matterId }: { matterId: string }) {
  const [invoice, setInvoice] = useState<MatterInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("500.00");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [checkNumber, setCheckNumber] = useState("");
  const [note, setNote] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PaymentReceipt | null>(null);

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
    const data = await recordBillingPayment(matterId, {
      amount: paymentAmount,
      method: paymentMethod,
      checkNumber: checkNumber || undefined,
      note: note || undefined,
    });
    setInvoice(data.invoice);
    setLastReceipt(data.receipt);
    setShowPayment(false);
  };

  if (loading || !invoice) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = parseFloat(invoice.balanceDue);

  return (
    <div className="staff-panel staff-panel--sm space-y-6 animate-fade-in">
      <header>
        <Badge className="mb-2">{BRAND.trustLedger.short}</Badge>
        <h1 className="font-display text-3xl font-bold">{BRAND.trustLedger.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chapter {invoice.chapter} · {invoice.status} · instant receipts
        </p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-primary" />
            Fee breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-6 pt-0">
          {invoice.lines.map((line) => (
            <div
              key={line.id}
              className="flex justify-between border-b border-border py-3 text-sm last:border-0"
            >
              <span className="text-muted-foreground">{line.description}</span>
              <span className="font-semibold tabular-nums">${line.amount}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary-muted/50 to-white">
        <CardContent className="space-y-3 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">${invoice.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-success">
            <span>Paid</span>
            <span className="font-semibold tabular-nums">${invoice.paidAmount}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="font-semibold">Balance due</span>
            <span className="font-display text-2xl font-bold tabular-nums text-primary">
              ${invoice.balanceDue}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-4" />
              Trust balance
            </span>
            <span className="font-semibold tabular-nums">${invoice.trustBalance}</span>
          </div>
        </CardContent>
      </Card>

      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-6 pt-0">
            {invoice.payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">${p.amount} · {p.method}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.receivedAt).toLocaleDateString()}
                    {p.checkNumber ? ` · Check #${p.checkNumber}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => printReceipt(p, invoice)}
                >
                  <Printer className="size-3.5" />
                  Print
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lastReceipt && (
        <Card className="border-emerald-200 bg-success-muted/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm font-medium">Payment recorded — ${lastReceipt.amount}</p>
            <Button size="sm" onClick={() => printReceipt(lastReceipt, invoice)}>
              <Printer className="size-4" />
              Print receipt
            </Button>
          </CardContent>
        </Card>
      )}

      {balance > 0 && (
        <>
          {showPayment ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <label className="text-sm font-medium">Amount received</label>
                <Input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputMode="decimal"
                />
                <label className="text-sm font-medium">Payment method</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {paymentMethod === "check" && (
                  <Input
                    placeholder="Check number"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                  />
                )}
                <Input
                  placeholder="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void handlePayment()}>
                    Record & print receipt
                  </Button>
                  <Button variant="secondary" onClick={() => setShowPayment(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button variant="success" size="lg" className="w-full" onClick={() => setShowPayment(true)}>
              Record client payment
            </Button>
          )}
        </>
      )}
    </div>
  );
}
