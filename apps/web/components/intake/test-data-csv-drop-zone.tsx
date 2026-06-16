"use client";

import { useCallback, useId, useState } from "react";
import { Download, FlaskConical, Loader2, Upload } from "lucide-react";
import { importTestDataCsv, type TestDataImportResult } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SAMPLE_URL = "/samples/test-data-summary.csv";

export function TestDataCsvDropZone({
  matterId,
  onImported,
}: {
  matterId: string;
  onImported?: (result: TestDataImportResult) => void;
}) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runImport = useCallback(
    async (csvText: string, fileName?: string) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        const { result } = await importTestDataCsv(matterId, csvText);
        const summary = result.lines.join(" · ");
        setMessage(
          fileName
            ? `Imported ${fileName} — ${summary}`
            : `Imported sample data — ${summary}`
        );
        onImported?.(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      } finally {
        setBusy(false);
      }
    },
    [matterId, onImported]
  );

  const readFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
        setError("Please drop a .csv file (test data summary format).");
        return;
      }
      const text = await file.text();
      await runImport(text, file.name);
    },
    [runImport]
  );

  const loadSample = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) throw new Error("Could not load sample CSV");
      await runImport(await res.text(), "test-data-summary.csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sample");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/40 p-5 dark:border-amber-700/50 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-amber-700 dark:text-amber-400" />
            <h3 className="text-sm font-bold">Test data summary</h3>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              Demo only
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Drop a fake CSV to fill {BRAND.reliefScout.short.toLowerCase()} (income, debts, chapter), add paystubs, W-2s, bank
            statements, and creditors — for testing only.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={SAMPLE_URL} download="test-data-summary.csv">
            <Download className="size-3.5" />
            Sample CSV
          </a>
        </Button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void readFile(file);
        }}
        className={cn(
          "rounded-lg border-2 border-dashed p-6 text-center transition-all",
          isDragging
            ? "border-amber-500 bg-amber-100/50 dark:bg-amber-900/30"
            : "border-amber-200/80 bg-background/60 dark:border-amber-800/60"
        )}
      >
        <Upload className="mx-auto mb-2 size-5 text-amber-700 dark:text-amber-400" />
        <p className="text-sm font-medium">Drop test CSV here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Includes bankruptcy fields, debts, paystubs, W-2s, and document filenames
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          id={inputId}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void readFile(file);
            e.target.value = "";
          }}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild size="sm" variant="secondary" disabled={busy}>
            <label htmlFor={inputId} className="cursor-pointer">
              {busy ? <Loader2 className="animate-spin" /> : "Browse CSV"}
            </label>
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void loadSample()}>
            Load sample into this file
          </Button>
        </div>
      </div>

      {message && <p className="text-sm font-medium text-primary">{message}</p>}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
