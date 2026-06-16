"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileUp,
  GraduationCap,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import {
  completePortalCounseling,
  fetchPortal,
  uploadPortalDocument,
  uploadPortalGeneralDocument,
  sendPortalClientMessage,
  type PortalData,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { FIRM } from "@/lib/firm";
import { LomberaLogo } from "@/components/brand/lombera-logo";
import { FirmPortalFooter } from "@/components/brand/firm-portal-footer";
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
  const [clientMessage, setClientMessage] = useState("");
  const [messageSending, setMessageSending] = useState(false);

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

  const handleUpload = async (requestId: string, file: File) => {
    setUploading(requestId);
    try {
      await uploadPortalDocument(token, requestId, file);
      await load();
    } finally {
      setUploading(null);
    }
  };

  const handleGeneralUpload = async (file: File) => {
    setUploading("general");
    try {
      await uploadPortalGeneralDocument(token, file);
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
      <div className="lombera-hero flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <LomberaLogo variant="hero" showWordmark={false} />
        <Loader2 className="size-7 animate-spin text-[#86868b]" />
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="lombera-hero flex min-h-screen items-center justify-center p-6">
        <Card className="lombera-card w-full max-w-md border-[#e8e4dc]">
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
    <div className="lombera-hero min-h-screen">
      <div className="mx-auto max-w-md px-4 py-8 pb-16">
        <header className="animate-fade-in space-y-6 text-center">
          <LomberaLogo variant="hero" />
          <div className="pt-1">
            <p className="text-xs font-medium text-[#86868b]">{FIRM.portal.title}</p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#1d1d1f]">
              Welcome, {portal.debtorName}
            </h1>
            <p className="mt-1 text-sm text-[#86868b]">
              Chapter {portal.chapter} bankruptcy
              {portal.caseNumber && ` · Case ${portal.caseNumber}`}
            </p>
          </div>
          <Card className="lombera-card text-left">
            <CardContent className="p-4 text-sm leading-relaxed text-[#424245]">
              {portal.message}
            </CardContent>
          </Card>
          <div className="flex items-center justify-center gap-2 text-xs text-[#8a8278]">
            <Lock className="size-3.5" />
            Private & encrypted · {completedCount}/{portal.requests.length} documents submitted
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
                    <>
                      <input
                        type="file"
                        accept="image/*,.pdf,.PDF"
                        capture="environment"
                        className="hidden"
                        id={`upload-${req.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUpload(req.id, file);
                        }}
                      />
                      <Button
                        className="w-full"
                        disabled={uploading === req.id}
                        asChild
                      >
                        <label htmlFor={`upload-${req.id}`} className="cursor-pointer">
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
                        </label>
                      </Button>
                    </>
                  )}
                  {req.status === "uploaded" && (
                    <p className="text-xs font-medium text-success">Attorney reviewing</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Anything else?
          </h2>
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">
                Upload any other document — W-2s, bills, court papers. Your attorney sees it
                instantly.
              </p>
              <input
                type="file"
                accept="image/*,.pdf,.PDF"
                capture="environment"
                className="hidden"
                id="upload-general"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleGeneralUpload(file);
                }}
              />
              <Button className="w-full" variant="secondary" disabled={uploading === "general"} asChild>
                <label htmlFor="upload-general" className="cursor-pointer">
                  {uploading === "general" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <FileUp />
                      Upload additional file
                    </>
                  )}
                </label>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Message your attorney
          </h2>
          <Card>
            <CardContent className="space-y-3 p-5">
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm min-h-[72px]"
                placeholder="Questions or updates for your attorney…"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!clientMessage.trim() || messageSending}
                onClick={async () => {
                  setMessageSending(true);
                  try {
                    await sendPortalClientMessage(token, clientMessage.trim());
                    setClientMessage("");
                  } finally {
                    setMessageSending(false);
                  }
                }}
              >
                {messageSending ? <Loader2 className="animate-spin" /> : "Send message"}
              </Button>
            </CardContent>
          </Card>
        </section>

        <FirmPortalFooter />
      </div>
    </div>
  );
}
