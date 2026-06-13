"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Lock,
  Shield,
  Upload,
} from "lucide-react";
import { fetchPortal, uploadPortalDocument, type PortalData } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ClientPortal({ token }: { token: string }) {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortal(token);
      setPortal(data.portal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portal");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (requestId: string) => {
    setUploading(requestId);
    try {
      await uploadPortalDocument(token, requestId, `upload_${Date.now()}.pdf`);
      await load();
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-hero">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-hero p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-semibold">Portal unavailable</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="secondary" onClick={() => void load()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = portal.requests.filter(
    (r) => r.status === "complete" || r.status === "uploaded"
  ).length;

  return (
    <div className="mesh-hero min-h-screen">
      <div className="mx-auto max-w-md px-4 py-8 pb-16">
        <header className="animate-fade-in space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <Shield className="size-8 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Secure client portal</p>
            <h1 className="font-display text-2xl font-bold">Hi, {portal.debtorName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chapter {portal.chapter} bankruptcy
              {portal.caseNumber && ` · Case ${portal.caseNumber}`}
            </p>
          </div>
          <Card className="border-primary/20 bg-primary-muted/40 text-left">
            <CardContent className="p-4 text-sm leading-relaxed">{portal.message}</CardContent>
          </Card>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Encrypted · {completedCount}/{portal.requests.length} documents submitted
          </div>
        </header>

        <section className="mt-8 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Documents needed
          </h2>
          {portal.requests.map((req) => {
            const done = req.status === "complete" || req.status === "uploaded";
            return (
              <Card
                key={req.id}
                className={cn(
                  "transition",
                  done ? "border-emerald-200 bg-success-muted/30" : "hover:shadow-elevated"
                )}
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{req.title}</h3>
                    <Badge variant={done ? "success" : "warning"}>
                      {done ? "Submitted" : `Due ${req.dueDate}`}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                  {req.uploadedFileName && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                      <CheckCircle2 className="size-3.5" />
                      {req.uploadedFileName}
                    </p>
                  )}
                  {req.status === "open" && (
                    <Button
                      className="w-full"
                      disabled={uploading === req.id}
                      onClick={() => void handleUpload(req.id)}
                    >
                      {uploading === req.id ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload />
                          Upload photo or PDF
                        </>
                      )}
                    </Button>
                  )}
                  {req.status === "uploaded" && (
                    <p className="text-xs font-medium text-success">Attorney reviewing</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <footer className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <FileUp className="size-3.5" />
          Powered by My Bankruptcy
        </footer>
      </div>
    </div>
  );
}
