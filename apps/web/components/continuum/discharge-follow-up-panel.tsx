"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import {
  fetchDischargeFollowUpPreview,
  sendDischargeFollowUp,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DischargeFollowUpPanel({ matterId }: { matterId: string }) {
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<{ subject: string; preview?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    void fetchDischargeFollowUpPreview(matterId)
      .then((d) => setPreview(d.template))
      .finally(() => setLoading(false));
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

  if (loading) {
    return <Loader2 className="size-6 animate-spin text-primary" />;
  }

  return (
    <Card className="border-primary/20 bg-primary-muted/20">
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-semibold">Discharge follow-up + personal injury</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Congratulate the client on discharge and let them know your firm also handles
            personal injury — if they were hurt in an accident, they can reach out separately.
          </p>
        </div>
        {preview && (
          <p className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">{preview.subject}</strong>
            <br />
            Includes PI cross-sell paragraph (configurable via PI_FIRM_NAME, PI_FIRM_URL env).
          </p>
        )}
        <label className="block text-sm">
          Client email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="client@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <Button className="w-full" disabled={sending || !email.trim()} onClick={() => void send()}>
          {sending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Send className="size-4" />
              Send discharge + PI note
            </>
          )}
        </Button>
        {result && (
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Mail className="size-4" />
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
