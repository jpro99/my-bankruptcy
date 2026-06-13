"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Loader2, Wallet } from "lucide-react";
import {
  fetchBilling,
  recordBillingPayment,
  type MatterInvoice,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function BillingPanel({ matterId }: { matterId: string }) {
  const [invoice, setInvoice] = useState<MatterInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("500.00");
  const [showPayment, setShowPayment] = useState(false);

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
    const data = await recordBillingPayment(matterId, paymentAmount);
    setInvoice(data.invoice);
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
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <header>
        <Badge className="mb-2">Billing</Badge>
        <h1 className="font-display text-3xl font-bold">Fees & Trust</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chapter {invoice.chapter} · {invoice.status}
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

      {balance > 0 && (
        <>
          {showPayment ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <label className="text-sm font-medium">Payment amount</label>
                <Input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  type="text"
                  inputMode="decimal"
                />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => void handlePayment()}>
                    Record payment
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
