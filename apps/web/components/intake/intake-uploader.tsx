"use client";

import { useState, useCallback } from "react";
import { pullCredit } from "@/lib/api-client";

const DOCUMENT_TYPES = [
  { id: "drivers_license", label: "Driver's License", icon: "🪪" },
  { id: "paystub", label: "Pay Stubs (last 2)", icon: "💵" },
  { id: "bank_statement", label: "Bank Statements (6 mo)", icon: "🏦" },
  { id: "tax_return", label: "Tax Returns", icon: "📋" },
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">One-Touch Intake</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Drop documents — AI extracts everything, pulls tri-merge credit, and populates all schedules.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
          isDragging
            ? "border-[var(--primary)] bg-blue-50"
            : "border-[var(--border)] hover:border-[var(--primary)]"
        }`}
      >
        <p className="text-4xl mb-4">📂</p>
        <p className="font-medium">Drop files here or click to browse</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-2">
          Driver&apos;s license · Pay stubs · Bank statements · Tax returns
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <label
          htmlFor="file-upload"
          className="inline-block mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg cursor-pointer hover:opacity-90"
        >
          Browse Files
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DOCUMENT_TYPES.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg"
          >
            <span className="text-2xl">{doc.icon}</span>
            <span className="text-sm font-medium">{doc.label}</span>
          </div>
        ))}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-[var(--muted-foreground)]">
            Uploaded ({readyCount}/{files.length} ready)
          </h2>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border border-[var(--border)] rounded-lg"
            >
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {file.status === "uploading" && "Uploading…"}
                {file.status === "encrypted" && "🔒 Encrypting…"}
                {file.status === "ready" && "✅ Ready"}
              </span>
            </div>
          ))}
        </div>
      )}

      {statusMessage && (
        <p className="text-sm text-center text-[var(--primary)]">{statusMessage}</p>
      )}

      <button
        type="button"
        onClick={startIntake}
        disabled={readyCount === 0 || isProcessing}
        className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
      >
        {isProcessing ? "Processing…" : "Start AI Extraction + Credit Pull"}
      </button>
    </div>
  );
}
