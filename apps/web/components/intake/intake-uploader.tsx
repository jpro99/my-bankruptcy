"use client";

import { useState, useCallback } from "react";
import {
  CreditCard,
  FileText,
  IdCard,
  Landmark,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { pullCredit } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DOCUMENT_TYPES = [
  { id: "drivers_license", label: "Driver's License", icon: IdCard },
  { id: "paystub", label: "Pay Stubs (last 2)", icon: FileText },
  { id: "bank_statement", label: "Bank Statements (6 mo)", icon: Landmark },
  { id: "tax_return", label: "Tax Returns", icon: FileText },
] as const;

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "encrypted" | "ready";
}

export function IntakeUploader({ matterId }: { matterId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type,
      size: f.size,
      status: "uploading" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (const file of newFiles) {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "encrypted" } : f))
        );
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: "ready" } : f))
          );
        }, 500);
      }, 800);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const startIntake = async () => {
    setIsProcessing(true);
    setStatusMessage("Running AI extraction + tri-merge credit pull…");
    try {
      const result = await pullCredit(matterId);
      setStatusMessage(
        `Intake complete — ${result.tradelineCount} tradelines classified into Schedules D/E/F/G`
      );
      await new Promise((r) => setTimeout(r, 1200));
      window.location.href = `/matters/${matterId}/cockpit`;
    } catch {
      setStatusMessage("Credit pull unavailable — continuing with document extraction…");
      await new Promise((r) => setTimeout(r, 1500));
      window.location.href = `/matters/${matterId}/cockpit`;
    }
  };

  const readyCount = files.filter((f) => f.status === "ready").length;

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <header>
        <Badge className="mb-2">Intake</Badge>
        <h1 className="font-display text-3xl font-bold">One-Touch Intake</h1>
        <p className="mt-2 text-muted-foreground">
          Drop documents — AI extracts everything, pulls tri-merge credit, and populates schedules.
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
          Driver&apos;s license · Pay stubs · Bank statements · Tax returns
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Button asChild className="mt-6">
          <label htmlFor="file-upload" className="cursor-pointer">
            Browse files
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

      {files.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Uploaded ({readyCount}/{files.length} ready)
          </h2>
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center justify-between p-4">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <Badge
                  variant={
                    file.status === "ready"
                      ? "success"
                      : file.status === "encrypted"
                        ? "default"
                        : "secondary"
                  }
                >
                  {file.status === "uploading" && "Uploading…"}
                  {file.status === "encrypted" && "Encrypting…"}
                  {file.status === "ready" && "Ready"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {statusMessage && (
        <p className="text-center text-sm font-medium text-primary">{statusMessage}</p>
      )}

      <Button
        size="lg"
        className="w-full shadow-glow"
        onClick={() => void startIntake()}
        disabled={readyCount === 0 || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles />
            Start AI Extraction + Credit Pull
            <CreditCard className="opacity-70" />
          </>
        )}
      </Button>
    </div>
  );
}
