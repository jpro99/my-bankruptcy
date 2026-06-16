"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Printer, Send } from "lucide-react";
import {
  fetchAutopilot,
  fetchCommandCenter,
  fetchDischargeFollowUpPreview,
  sendDischargeFollowUp,
} from "@/lib/api-client";
import { printDischargeThankYouLetter } from "@/lib/print-documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function DischargeFollowUpPanel({ matterId }: { matterId: string }) {
  const [clientName, setClientName] = useState("");
  const [caseNumber, setCaseNumber] = useState<string | undefined>();
  const [chapter, setChapter] = useState<string | undefined>();
  const [discharged, setDischarged] = useState(false);
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<{ subject: string; preview?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetchDischargeFollowUpPreview(matterId)
        .then((d) => setPreview(d.template))
        .catch(() => null),
      fetchCommandCenter(matterId)
        .then((d) => {
          setClientName(d.progress.debtorDisplayName || "");
          if (d.progress.chapter) setChapter(d.progress.chapter);
        })
        .catch(() => null),
      fetchAutopilot(matterId)
        .then((d) => {
          if (d.timeline?.caseNumber) setCaseNumber(d.timeline.caseNumber);
          if (d.timeline?.chapter) setChapter(d.timeline.chapter);
          const dischargeDone = d.timeline?.tasks.some(
            (t) => t.id === "discharge-track" && t.status === "completed"
          );
          setDischarged(!!dischargeDone);
        })
        .catch(() => null),
    ]).finally(() => setLoading(false));

    if (matterId === "demo-filed" || matterId === "demo") {
      setEmail("maria.test@example.com");
    }
  }, [matterId]);

  const send = async () => {
    if (!email.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendDischargeFollowUp(matterId, {
        clientEmail: email.trim(),
        includePiCrossSell: true,
        sendEmail: true,
      });
      if (res.email?.ok) {
        setResult(`Sent via email — ${res.template.subject}`);
      } else if (res.email?.mailto) {
        window.location.href = res.email.mailto;
        setResult("Opened Gmail — review and send discharge + personal injury note");
      } else {
        setResult(res.email?.error ?? "Could not send — check Resend config");
      }
    } finally {
      setSending(false);
    }
  };

  const printLetter = () => {
    if (!clientName.trim()) return;
    printDischargeThankYouLetter({
      clientName: clientName.trim(),
      chapter,
      caseNumber,
    });
  };

  if (loading) {
    return <Loader2 className="size-6 animate-spin text-primary" />;
  }

  return (
    <Card className="border-primary/20 bg-primary-muted/20">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold">Discharge closure — thank you letter</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When the case is discharged, print a professional thank-you letter with personal injury
            referral and Google / Yelp review request.
          </p>
          {discharged && (
            <p className="mt-2 text-sm font-medium text-success">Discharge track complete — ready to send.</p>
          )}
        </div>

        <label className="block text-sm font-medium">
          Client name
          <Input
            className="mt-1"
            placeholder="Client full name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </label>

        <Button
          type="button"
          className="w-full"
          variant="secondary"
          disabled={!clientName.trim()}
          onClick={printLetter}
        >
          <Printer className="size-4" />
          Print thank you letter
        </Button>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold">Email follow-up (optional)</h4>
          {preview && (
            <p className="mt-2 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">{preview.subject}</strong>
              <br />
              Includes PI cross-sell paragraph.
            </p>
          )}
          <label className="mt-3 block text-sm">
            Client email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="client@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button
            className="mt-3 w-full"
            disabled={sending || !email.trim()}
            onClick={() => void send()}
          >
            {sending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send className="size-4" />
                Send discharge + PI email
              </>
            )}
          </Button>
          {result && (
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Mail className="size-4" />
              {result}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
