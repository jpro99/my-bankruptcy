"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Scale, Users } from "lucide-react";
import { listDemoMatters, type DemoMatterSummary } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MobileMattersList() {
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDemoMatters();
      setMatters(data.matters);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (matters.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No matters yet — create one from the full site at /clients
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {matters.map((m) => (
        <li key={m.matterId}>
          <Link href={`/mobile/matter/${m.matterId}`}>
            <Card
              className={cn(
                "active:scale-[0.98] transition-transform",
                m.pendingDocuments > 0 && "border-amber-200"
              )}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted">
                  <Users className="size-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-base">{m.debtorDisplayName}</p>
                  <p className="text-xs text-muted-foreground">
                    Ch {m.chapter}
                    {m.pendingDocuments > 0 && ` · ${m.pendingDocuments} to sync`}
                    {m.noteCount > 0 && ` · ${m.noteCount} notes`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={m.status === "filed" ? "success" : "secondary"} className="text-[10px]">
                    {m.status}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MobileMattersHeader() {
  return (
    <header className="flex items-center gap-3 pb-2">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary shadow-glow">
        <Scale className="size-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {BRAND.reliefPocket.shortName}
        </p>
        <h1 className="font-display text-xl font-bold">{BRAND.reliefPocket.name}</h1>
      </div>
    </header>
  );
}
