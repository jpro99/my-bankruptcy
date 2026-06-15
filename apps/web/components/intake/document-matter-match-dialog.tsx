"use client";

import { AlertTriangle } from "lucide-react";
import type { UploadMatchPreview } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DocumentMatterMatchDialog({
  preview,
  fileName,
  busy,
  onUseMatch,
  onKeepCurrent,
  onCancel,
}: {
  preview: UploadMatchPreview;
  fileName: string;
  busy?: boolean;
  onUseMatch: () => void;
  onKeepCurrent: () => void;
  onCancel: () => void;
}) {
  const matchName = preview.bestMatch?.debtorDisplayName ?? "another client";
  const extracted = preview.extracted.fullName ?? "this client";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <Card className="w-full max-w-md border-amber-300 shadow-elevated">
        <CardContent className="space-y-4 p-5">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="size-5 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-base">Wrong file?</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                <strong>{fileName}</strong> looks like <strong>{extracted}</strong>&apos;s document.
                You&apos;re on <strong>{preview.currentMatter.debtorDisplayName}</strong>&apos;s matter.
              </p>
              <p className="mt-2 text-sm">
                This matches <strong>{matchName}</strong>&apos;s case.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={busy} onClick={() => void onUseMatch()}>
              File under {matchName}
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              disabled={busy}
              onClick={() => void onKeepCurrent()}
            >
              Keep on {preview.currentMatter.debtorDisplayName}
            </Button>
          </div>
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground hover:underline"
            onClick={onCancel}
          >
            Cancel upload
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
