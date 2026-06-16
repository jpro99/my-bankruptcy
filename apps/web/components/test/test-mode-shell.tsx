"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { TestModeBanner } from "@/components/test/test-mode-banner";
import { TestWalkthroughCoach } from "@/components/test/test-walkthrough-coach";
import { MobileFieldCaptureFab } from "@/components/field-capture/mobile-field-capture-fab";

function TestWalkthroughCoachFallback() {
  return null;
}

export function TestModeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const testMode = pathname.startsWith("/test");

  return (
    <div className={testMode ? "test-mode-shell" : "app-shell"}>
      <TestModeBanner />
      {children}
      {testMode && (
        <Suspense fallback={<TestWalkthroughCoachFallback />}>
          <TestWalkthroughCoach />
        </Suspense>
      )}
      <MobileFieldCaptureFab />
    </div>
  );
}
