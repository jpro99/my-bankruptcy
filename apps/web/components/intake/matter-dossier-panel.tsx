"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Printer, Sparkles } from "lucide-react";
import {
  applyForgeSync,
  fetchMatterDossier,
  type IntakeDocument,
  type MatterNote,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function printDossier(
  matterId: string,
  documents: IntakeDocument[],
  notes: MatterNote[]
) {
  const docRows = documents
    .map(
      (d) =>
        `<tr><td>${d.fileName}</td><td>${d.documentType}</td><td>${d.uploadedBy}</td><td>${d.status}</td><td>${d.uploadedAt.slice(0, 10)}</td></tr>`
    )
    .join("");
  const noteRows = notes
    .map(
      (n) =>
        `<tr><td>${n.createdAt.slice(0, 16).replace("T", " ")}</td><td>${n.authorLabel}</td><td>${n.text}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Matter Dossier — ${matterId}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;max-width:800px;margin:0 auto}
h1{font-size:20px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f4f4f4}
.note td:last-child{white-space:pre-wrap}</style></head><body>
<h1>${BRAND.dossier.name} — Matter ${matterId}</h1>
<p>Printed ${new Date().toLocaleString()}</p>
<h2>Documents (${documents.length})</h2>
<table><thead><tr><th>File</th><th>Type</th><th>From</th><th>Status</th><th>Date</th></tr></thead>
<tbody>${docRows || "<tr><td colspan=5>No documents yet</td></tr>"}</tbody></table>
<h2>Notes (${notes.length})</h2>
<table class="note"><thead><tr><th>When</th><th>By</th><th>Note</th></tr></thead>
<tbody>${noteRows || "<tr><td colspan=3>No notes yet</td></tr>"}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export function MatterDossierPanel({
  matterId,
  onSyncComplete,
}: {
  matterId: string;
  onSyncComplete?: () => void;
}) {
  const [documents, setDocuments] = useState<IntakeDocument[]>([]);
  const [notes, setNotes] = useState<MatterNote[]>([]);
  const [pendingApplyCount, setPendingApplyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dossier } = await fetchMatterDossier(matterId);
      setDocuments(dossier.documents);
      setNotes(dossier.notes);
      setPendingApplyCount(dossier.pendingApplyCount);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await applyForgeSync(matterId);
      setSyncMessage(result.message);
      await load();
      onSyncComplete?.();
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{BRAND.dossier.name}</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} document(s) · {notes.length} note(s) on file
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => printDossier(matterId, documents, notes)}
          >
            <Printer className="size-4" />
            Print dossier
          </Button>
          <Button size="sm" disabled={syncing || pendingApplyCount === 0} onClick={() => void handleSync()}>
            {syncing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Sparkles className="size-4" />
                {BRAND.forgeSync.action}
                {pendingApplyCount > 0 && ` (${pendingApplyCount})`}
              </>
            )}
          </Button>
        </div>
      </div>

      {syncMessage && (
        <p className="text-sm font-medium text-primary">{syncMessage}</p>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nothing yet — send the Client Vault link or upload from Document Drop. Each file lands
            here automatically.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.uploadedBy === "client" ? "Client Vault" : "Attorney"} ·{" "}
                      {doc.documentType.replace(/_/g, " ")} · {doc.uploadedAt.slice(0, 10)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={doc.status === "applied" ? "success" : "warning"}
                  className={cn(doc.status === "applied" && "shrink-0")}
                >
                  {doc.status === "applied" ? "In petition" : "Ready to sync"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            File notes
          </h3>
          {notes.slice(0, 8).map((note) => (
            <Card key={note.id} className="border-dashed">
              <CardContent className="p-4">
                <p className="text-sm">{note.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.authorLabel} · {note.createdAt.slice(0, 16).replace("T", " ")}
                  {note.source === "voice" && " · voice"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
