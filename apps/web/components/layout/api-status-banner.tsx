"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Wifi, WifiOff, X } from "lucide-react";
import { checkApiHealth } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function ApiStatusBanner() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const probe = async () => {
      const ok = await checkApiHealth();
      if (mounted) setStatus(ok ? "online" : "offline");
    };

    void probe();
    const interval = setInterval(() => void probe(), 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status !== "offline" || dismissed) return null;

  const isProduction =
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/);

  return (
    <div className="sticky top-0 z-[100] border-b border-amber-200 bg-warning-muted px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex items-start gap-3 text-sm">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold text-amber-900">API not connected</p>
            <p className="text-amber-800/80">
              {isProduction
                ? "Deploy the API on Railway and set NEXT_PUBLIC_API_URL in Vercel, then redeploy."
                : "Start the API with pnpm dev (port 3002) so approve, file, and billing work."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-800 hover:bg-amber-100"
            onClick={() => void checkApiHealth().then((ok) => setStatus(ok ? "online" : "offline"))}
          >
            <Wifi className="size-3.5" />
            Retry
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact inline indicator for matter headers */
export function ApiStatusDot() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void checkApiHealth().then(setOnline);
  }, []);

  if (online === null) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
      title={online ? "API connected" : "API offline"}
    >
      {online ? (
        <>
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Live
        </>
      ) : (
        <>
          <AlertTriangle className="size-3 text-warning" />
          Offline
        </>
      )}
    </span>
  );
}
