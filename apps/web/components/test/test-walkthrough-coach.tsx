"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { matchWalkthroughStep } from "@/lib/test-walkthrough";
import { useTestMode } from "@/lib/test-mode";

export function TestWalkthroughCoach() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { testMode, walkthroughEnabled, appHref } = useTestMode();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const fullPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const step = testMode && walkthroughEnabled ? matchWalkthroughStep(fullPath) : null;

  useEffect(() => {
    setDismissed(null);
  }, [fullPath]);

  if (!step || dismissed === step.id) return null;

  return (
    <div className="test-walkthrough-coach" role="dialog" aria-labelledby="test-coach-title">
      <button
        type="button"
        className="test-walkthrough-coach__close"
        aria-label="Dismiss this step"
        onClick={() => setDismissed(step.id)}
      >
        <X className="size-4" />
      </button>
      <p className="test-walkthrough-coach__eyebrow">Test walkthrough</p>
      <h2 id="test-coach-title" className="test-walkthrough-coach__title">
        {step.title}
      </h2>
      <p className="test-walkthrough-coach__body">{step.body}</p>
      <Link href={appHref(step.nextPath)} className="app-btn app-btn--primary">
        {step.nextLabel} →
      </Link>
    </div>
  );
}
