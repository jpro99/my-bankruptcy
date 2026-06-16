"use client";

import { useCallback, useId, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadIntakeDocumentFile, type UploadMatchPreview } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DocumentMatterMatchDialog } from "@/components/intake/document-matter-match-dialog";

function inferType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("license") || lower.includes("id")) return "drivers_license";
  if (lower.includes("pay")) return "paystub";
  if (lower.includes("bank")) return "bank_statement";
  if (lower.includes("tax") || lower.includes("1040")) return "tax_return";
  return "other";
}

export function DocumentDropZone({
  matterId,
  clientName,
  onUploaded,
  compact = false,
}: {
  matterId: string;
  clientName?: string;
  onUploaded?: (message: string) => void;
  compact?: boolean;
}) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [matchPrompt, setMatchPrompt] = useState<{
    preview: UploadMatchPreview;
    file: File;
    documentType: string;
  } | null>(null);

  const finishUpload = useCallback(
    async (
      file: File,
      documentType: string,
      options?: { confirmMismatch?: boolean; targetMatterId?: string }
    ) => {
      const result = await uploadIntakeDocumentFile(matterId, file, documentType, options);
      if (!result.ok) {
        setMatchPrompt({ preview: result.mismatch, file, documentType });
        return false;
      }
      if (result.savedToMatterId !== matterId) {
        onUploaded?.(`Filed under ${result.savedToMatterId} — identity match`);
      }
      return true;
    },
    [matterId, onUploaded]
  );

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setUploading(true);
      try {
        let uploaded = 0;
        let stoppedForMatch = false;
        for (const file of Array.from(fileList)) {
          const docType = inferType(file.name);
          const ok = await finishUpload(file, docType);
          if (!ok) {
            stoppedForMatch = true;
            break;
          }
          uploaded += 1;
        }
        if (uploaded > 0 && !stoppedForMatch) {
          onUploaded?.(
            uploaded === 1
              ? `Uploaded 1 file to ${clientName ? `${clientName}'s file` : "this matter"}`
              : `Uploaded ${uploaded} files to ${clientName ? `${clientName}'s file` : "this matter"}`
          );
        }
      } finally {
        setUploading(false);
      }
    },
    [clientName, finishUpload, onUploaded]
  );

  const label = clientName ? `Upload to ${clientName}'s file` : "Upload from your computer";

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed text-center transition-all",
          compact ? "p-5" : "p-8",
          isDragging
            ? "border-primary bg-primary-muted/50"
            : "border-border bg-muted/20 hover:border-primary/40"
        )}
      >
        <div
          className={cn(
            "mx-auto mb-3 flex items-center justify-center rounded-xl bg-primary-muted",
            compact ? "size-10" : "size-12"
          )}
        >
          <Upload className={cn("text-primary", compact ? "size-5" : "size-6")} />
        </div>
        <p className={cn("font-semibold", compact && "text-sm")}>{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop files here or browse — PDF, images, scans from your computer
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.PDF,.doc,.docx,.xls,.xlsx"
          className="hidden"
          id={inputId}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button asChild className="mt-4" size={compact ? "sm" : "default"} disabled={uploading}>
          <label htmlFor={inputId} className="cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Browse files
              </>
            )}
          </label>
        </Button>
      </div>

      {matchPrompt && (
        <DocumentMatterMatchDialog
          preview={matchPrompt.preview}
          fileName={matchPrompt.file.name}
          busy={uploading}
          onUseMatch={async () => {
            setUploading(true);
            try {
              const target = matchPrompt.preview.bestMatch!.matterId;
              const ok = await finishUpload(matchPrompt.file, matchPrompt.documentType, {
                targetMatterId: target,
              });
              if (ok) {
                setMatchPrompt(null);
                onUploaded?.(
                  `Filed under ${matchPrompt.preview.bestMatch!.debtorDisplayName}'s file`
                );
              }
            } finally {
              setUploading(false);
            }
          }}
          onKeepCurrent={async () => {
            setUploading(true);
            try {
              const ok = await finishUpload(matchPrompt.file, matchPrompt.documentType, {
                confirmMismatch: true,
              });
              if (ok) {
                setMatchPrompt(null);
                onUploaded?.(
                  `Kept on ${matchPrompt.preview.currentMatter.debtorDisplayName}'s file`
                );
              }
            } finally {
              setUploading(false);
            }
          }}
          onCancel={() => setMatchPrompt(null)}
        />
      )}
    </>
  );
}
