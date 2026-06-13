"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileUp,
  GraduationCap,
  Loader2,
  Lock,
  Shield,
  Upload,
} from "lucide-react";
import {
  completePortalCounseling,
  fetchPortal,
  uploadPortalDocument,
  type PortalData,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ClientPortal({ token }: { token: string }) {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [counselingBusy, setCounselingBusy] = useState<number | null>(null);
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

  const handleCounselingComplete = async (course: 1 | 2, simulateGold?: boolean) => {
    setCounselingBusy(course);
    try {
      const res = await completePortalCounseling(token, course, {
        certificateFileName: `course_${course}_cert.pdf`,
        simulateGold,
      });
      setPortal(res.portal);
    } finally {
      setCounselingBusy(null);
    }
  };

  const renderCourse = (
    courseNum: 1 | 2,
    title: string,
    course: PortalData["counseling"]["course1"]
  ) => {
    const locked = course.status === "locked";
    const done = course.status === "complete";
    const tier = portal?.counseling.tier;

    return (
      <Card key={courseNum} className={cn("transition", done && "border-emerald-200 bg-success-muted/30")}>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">
                via {portal?.counseling.providerLabel}
              </p>
            </div>
            <Badge variant={done ? "success" : locked ? "secondary" : "warning"}>
              {locked ? "After filing" : done ? "Complete" : "Required"}
            </Badge>
          </div>

          {!locked && !done && (
            <>
              <Button asChild variant="secondary" className="w-full">
                <a
                  href={portal?.counseling.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Take course online
                </a>
              </Button>

              {tier === "vault" && (
                <Button
                  className="w-full"
                  disabled={counselingBusy === courseNum}
                  onClick={() => void handleCounselingComplete(courseNum)}
                >
                  {counselingBusy === courseNum ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload />
                  )}
                  I finished — upload certificate
                </Button>
              )}

              {tier === "gold" && (
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  disabled={counselingBusy === courseNum}
                  onClick={() => void handleCounselingComplete(courseNum, true)}
                >
                  Demo: cert received automatically (Gold tier)
                </Button>
              )}

              {tier === "relay" && (
                <p className="text-xs text-muted-foreground">
                  When done, your certificate is relayed to your attorney automatically — or tap
                  upload if you have the PDF.
                </p>
              )}
            </>
          )}

          {done && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              {course.certificateNumber} · {course.completedAt?.slice(0, 10)}
            </p>
          )}
        </CardContent>
      </Card>
    );
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
            <p className="text-sm font-medium text-muted-foreground">{BRAND.portal.name}</p>
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
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <GraduationCap className="size-3.5" />
            {BRAND.counseling.name}
          </h2>
          {renderCourse(1, "Course 1 — Credit counseling (before filing)", portal.counseling.course1)}
          {renderCourse(2, "Course 2 — Debtor education (after filing)", portal.counseling.course2)}
        </section>

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
