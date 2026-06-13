"use client";

import { useCallback, useEffect, useState } from "react";
import {
  exportProvenance,
  fetchProvenance,
  type ProvenanceEvent,
} from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  FileSearch,
  Loader2,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: typeof Sparkles; variant: "default" | "success" | "secondary" | "warning" }
> = {
  ai_extracted: { label: "AI extracted", icon: Sparkles, variant: "secondary" },
  attorney_approved: { label: "Attorney approved", icon: UserCheck, variant: "success" },
  attorney_edited: { label: "Attorney edited", icon: UserCheck, variant: "default" },
  attorney_questioned: { label: "Questioned", icon: FileSearch, variant: "warning" },
  credit_imported: { label: "Credit import", icon: Shield, variant: "secondary" },
  system_computed: { label: "System computed", icon: Sparkles, variant: "secondary" },
};

export function AuditTrail({ matterId }: { matterId: string }) {
  const [events, setEvents] = useState<ProvenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProvenance(matterId);
      setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const bundle = await exportProvenance(matterId);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `provenance-${matterId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="mb-2">Audit-grade provenance</Badge>
          <h1 className="font-display text-3xl font-bold">Provenance Audit Trail</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Every AI extraction, credit import, and attorney approval — exportable for court
            challenges with SHA-256 integrity hash.
          </p>
        </div>
        <Button onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          Export JSON
        </Button>
      </header>

      <Card className="border-emerald-200 bg-success-muted/30">
        <CardContent className="flex items-center gap-3 p-4">
          <Shield className="size-5 text-success shrink-0" />
          <p className="text-sm">
            <strong>{events.length}</strong> provenance events recorded for this matter
          </p>
        </CardContent>
      </Card>

      <ul className="space-y-3">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ul>
    </div>
  );
}

function EventRow({ event }: { event: ProvenanceEvent }) {
  const config = EVENT_CONFIG[event.eventType] ?? {
    label: event.eventType,
    icon: FileSearch,
    variant: "outline" as const,
  };
  const Icon = config.icon;
  const meta = event.metadata as { fieldPath?: string; formId?: string } | undefined;

  return (
    <li>
      <Card>
        <CardContent className="flex gap-4 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={config.variant}>{config.label}</Badge>
              {meta?.formId && <Badge variant="outline">Form {meta.formId}</Badge>}
              <span className="text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>
            {meta?.fieldPath && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">{meta.fieldPath}</p>
            )}
            <p className="mt-2 text-sm font-medium truncate">
              {formatValue(event.newValue)}
            </p>
            {event.modelName && (
              <p className="mt-1 text-xs text-muted-foreground">
                {event.modelName}
                {event.confidence !== undefined && ` · ${Math.round(event.confidence * 100)}% confidence`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value);
}
