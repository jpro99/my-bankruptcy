"use client";

import { useTestMode } from "@/lib/test-mode";

export function TestModeBanner() {
  const { testMode, walkthroughEnabled, setWalkthroughEnabled } = useTestMode();
  if (!testMode) return null;

  return (
    <div className="test-mode-banner" role="status">
      <div className="test-mode-banner__label">TEST</div>
      <p className="test-mode-banner__text">
        Sandbox only — demo data, no live filing, no real client PII.
      </p>
      <label className="test-mode-banner__toggle">
        <input
          type="checkbox"
          checked={walkthroughEnabled}
          onChange={(e) => setWalkthroughEnabled(e.target.checked)}
        />
        Walkthrough prompts
      </label>
    </div>
  );
}
