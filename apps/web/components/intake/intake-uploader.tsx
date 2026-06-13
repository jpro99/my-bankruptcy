"use client";

import { useCallback, useState } from "react";
import {
  CreditCard,
  FileText,
  IdCard,
  Landmark,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { pullCredit, uploadIntakeDocument } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatterDossierPanel } from "@/components/intake/matter-dossier-panel";

const DOCUMENT_TYPES = [
  { id: "drivers_license", label: "Driver's License", icon: IdCard },
  { id: "paystub", label: "Pay Stubs (last 2)", icon: FileText },
  { id: "bank_statement", label: "Bank Statements (6 mo)", icon: Landmark },
  { id: "tax_return", label: "Tax Returns", icon: FileText },
] as const;

function inferType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("license") || lower.includes("id")) return "drivers_license";
  if (lower.includes("pay")) return "paystub";
  if (lower.includes("bank")) return "bank_statement";
  if (lower.includes("tax") || lower.includes("1040")) return "tax_return";
  return "other";
}

export function IntakeUploader({ matterId }: { matterId: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dossierKey, setDossierKey] = useState(0);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setUploading(true);
      try {
        for (const file of Array.from(fileList)) {
          await uploadIntakeDocument(matterId, file.name, inferType(file.name));
        }
        setDossierKey((k) => k + 1);
        setStatusMessage(`Uploaded ${fileList.length} file(s) to ${BRAND.dossier.name}`);
      } finally {
        setUploading(false);
      }
    },
    [matterId]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

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
          Client uploads from their phone land in the {BRAND.dossier.name}. Tap{" "}
          <strong>{BRAND.forgeSync.action}</strong> anytime — IDs today, paystubs tomorrow, petition
          fills as you go.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-2xl border-2 border-dashed p-12 text-center transition-all",
          isDragging
            ? "border-primary bg-primary-muted/50 shadow-glow"
            : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-muted">
          <Upload className="size-7 text-primary" />
        </div>
        <p className="font-semibold">Drop files here or browse</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Phone or computer — same matter file
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.PDF"
          capture="environment"
          className="hidden"
          id="file-upload"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
        <Button asChild className="mt-6" disabled={uploading}>
          <label htmlFor="file-upload" className="cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading…
              </>
            ) : (
              "Browse files"
            )}
          </label>
        </Button>
      </div>

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
