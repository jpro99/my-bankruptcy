"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function isSamsungBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /SamsungBrowser/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showSamsungHelp, setShowSamsungHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if (isSamsungBrowser() || isAndroid()) {
      setShowSamsungHelp(true);
    }
  }, [deferred]);

  if (installed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-center gap-3 p-4 text-sm">
          <Smartphone className="size-5 text-emerald-600 shrink-0" />
          <span className="font-medium text-emerald-800">
            {BRAND.reliefPocket.name} is on your home screen
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary-muted/30">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-glow">
            <Download className="size-5 text-white" />
          </div>
          <div>
            <p className="font-bold">{BRAND.reliefPocket.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Install to your home screen — Samsung, Android, or any phone. One tap opens your
              bankruptcy matters.
            </p>
          </div>
        </div>

        <Button className="w-full shadow-glow" onClick={() => void install()}>
          <Download className="size-4" />
          {deferred ? "Install app" : "Add to home screen"}
        </Button>

        {showSamsungHelp && !deferred && (
          <div className="rounded-lg border bg-background p-3 text-xs leading-relaxed text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Samsung / Android</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap the browser menu (⋮ or ≡)</li>
              <li>
                Choose <strong>Add to Home screen</strong> or <strong>Install app</strong>
              </li>
              <li>Name it <strong>Matters</strong> and confirm</li>
            </ol>
            <p className="text-[10px]">Chrome, Samsung Internet, and Edge all support this.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
