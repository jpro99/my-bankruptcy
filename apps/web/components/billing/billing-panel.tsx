"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Loader2, Printer, Wallet } from "lucide-react";
import {
  fetchBilling,
  fetchCommandCenter,
  recordBillingPayment,
  type MatterInvoice,
  type PaymentReceipt,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { printPaymentReceipt } from "@/lib/print-documents";
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

function receiptPrintPayload(
  receipt: PaymentReceipt,
  invoice: MatterInvoice,
  clientName: string
) {
  return {
    clientName,
    matterId: invoice.matterId,
    chapter: invoice.chapter,
    totalCharged: invoice.subtotal,
    amountReceived: receipt.amount,
    totalReceivedToDate: invoice.paidAmount,
    balanceRemaining: invoice.balanceDue,
    method: receipt.method,
    checkNumber: receipt.checkNumber,
    receivedAt: receipt.receivedAt,
    note: receipt.note,
  };
}

export function BillingPanel({ matterId }: { matterId: string }) {
  const [invoice, setInvoice] = useState<MatterInvoice | null>(null);
  const [clientName, setClientName] = useState("Client");
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("500.00");
  const [totalCharged, setTotalCharged] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [checkNumber, setCheckNumber] = useState("");
  const [note, setNote] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<PaymentReceipt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [billing, command] = await Promise.all([
        fetchBilling(matterId),
        fetchCommandCenter(matterId).catch(() => null),
      ]);
      setInvoice(billing.invoice);
      setTotalCharged(billing.invoice.subtotal);
      if (command?.progress.debtorDisplayName) {
        setClientName(command.progress.debtorDisplayName);
      }
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
    setTotalCharged(data.invoice.subtotal);
    setLastReceipt(data.receipt);
    setShowPayment(false);
    printPaymentReceipt(receiptPrintPayload(data.receipt, data.invoice, clientName));
  };

  const printQuickReceipt = () => {
    if (!invoice) return;
    printPaymentReceipt({
      clientName,
      matterId: invoice.matterId,
      chapter: invoice.chapter,
      totalCharged: totalCharged || invoice.subtotal,
      amountReceived: paymentAmount,
      totalReceivedToDate: invoice.paidAmount,
      balanceRemaining: invoice.balanceDue,
      method: PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod,
      checkNumber: checkNumber || undefined,
      note: note || undefined,
    });
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
          Chapter {invoice.chapter} · {invoice.status} · professional receipts
        </p>
      </header>

      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="size-4 text-primary" />
            Print receipt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Select this matter, enter what you received, and print a firm letterhead receipt.
          </p>
          <label className="block text-sm font-medium">Client name</label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          <label className="block text-sm font-medium">Total charged (bankruptcy fees)</label>
          <Input
            value={totalCharged}
            onChange={(e) => setTotalCharged(e.target.value)}
            inputMode="decimal"
          />
          <label className="block text-sm font-medium">Amount received</label>
          <Input
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            inputMode="decimal"
          />
          <label className="block text-sm font-medium">Payment method</label>
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={printQuickReceipt}>
              <Printer className="size-4" />
              Print receipt
            </Button>
            {balance > 0 && (
              <Button type="button" variant="secondary" onClick={() => setShowPayment(true)}>
                Record payment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
            <span className="text-muted-foreground">Total charged</span>
            <span className="font-semibold tabular-nums">${invoice.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm text-success">
            <span>Total received</span>
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
                  <p className="font-semibold">
                    ${p.amount} · {p.method}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.receivedAt).toLocaleDateString()}
                    {p.checkNumber ? ` · Check #${p.checkNumber}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    printPaymentReceipt(receiptPrintPayload(p, invoice, clientName))
                  }
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
            <Button
              size="sm"
              onClick={() =>
                printPaymentReceipt(receiptPrintPayload(lastReceipt, invoice, clientName))
              }
            >
              <Printer className="size-4" />
              Print receipt
            </Button>
          </CardContent>
        </Card>
      )}

      {balance > 0 && showPayment && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">
              Record payment to trust ledger, then print receipt automatically.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => void handlePayment()}>
                Record &amp; print receipt
              </Button>
              <Button variant="secondary" onClick={() => setShowPayment(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
