"use client";

import { useState } from "react";
import { CreditCard, FileText, IdCard, Landmark, Loader2, Sparkles } from "lucide-react";
import { pullCredit } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatterDossierPanel } from "@/components/intake/matter-dossier-panel";
import { DocumentDropZone } from "@/components/intake/document-drop-zone";

const DOCUMENT_TYPES = [
  { id: "drivers_license", label: "Driver's License", icon: IdCard },
  { id: "paystub", label: "Pay Stubs (last 2)", icon: FileText },
  { id: "bank_statement", label: "Bank Statements (6 mo)", icon: Landmark },
  { id: "tax_return", label: "Tax Returns", icon: FileText },
] as const;

export function IntakeUploader({ matterId }: { matterId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dossierKey, setDossierKey] = useState(0);

  const startFullIntake = async () => {
    setIsProcessing(true);
    setStatusMessage("Forge Sync + tri-merge credit pull…");
    try {
      const result = await pullCredit(matterId);
      setStatusMessage(
        `Intake complete — ${result.tradelineCount} tradelines classified into Schedules D/E/F/G`
      );
      await new Promise((r) => setTimeout(r, 1200));
      window.location.href = `/matters/${matterId}/forge`;
    } catch {
      setStatusMessage("Continuing to The Forge…");
      await new Promise((r) => setTimeout(r, 800));
      window.location.href = `/matters/${matterId}/forge`;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 animate-fade-in">
      <header>
        <Badge className="mb-2">Document Drop</Badge>
        <h1 className="font-display text-3xl font-bold">Collect & sync</h1>
        <p className="mt-2 text-muted-foreground">
          Upload from your computer or collect from the client&apos;s phone. Tap{" "}
          <strong>{BRAND.forgeSync.action}</strong> anytime — IDs today, paystubs tomorrow, petition
          fills as you go.
        </p>
      </header>

      <DocumentDropZone
        matterId={matterId}
        onUploaded={(message) => {
          setStatusMessage(message);
          setDossierKey((k) => k + 1);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        {DOCUMENT_TYPES.map((doc) => {
          const Icon = doc.icon;
          return (
            <Card key={doc.id} className="transition hover:border-primary/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{doc.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {statusMessage && (
        <p className="text-center text-sm font-medium text-primary">{statusMessage}</p>
      )}

      <MatterDossierPanel
        key={dossierKey}
        matterId={matterId}
        showUpload={false}
        onSyncComplete={() => setDossierKey((k) => k + 1)}
      />

      <Button
        size="lg"
        className="w-full shadow-glow"
        onClick={() => void startFullIntake()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles />
            Full intake — sync + credit pull → The Forge
            <CreditCard className="opacity-70" />
          </>
        )}
      </Button>
    </div>
  );
}
