"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listDemoMatters, type DemoMatterSummary } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { useTestMode } from "@/lib/test-mode";

export function FirmDashboard() {
  const { testMode, appHref } = useTestMode();
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);

  const load = useCallback(async () => {
    const data = await listDemoMatters();
    const list = testMode
      ? data.matters.filter((m) => m.matterId.startsWith("demo"))
      : data.matters;
    setMatters(list);
  }, [testMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = matters.length;
  const pendingSync = matters.reduce((a, m) => a + m.pendingDocuments, 0);
  const unread = matters.reduce((a, m) => a + (m.unreadPortalMessages ?? 0), 0);
  const scouts = matters.filter((m) => !m.consultComplete).length;

  return (
    <main>
      <h1 className="matters-page__title">
        {testMode ? "Test command center" : "Firm command center"}
      </h1>
      <p className="matters-page__subtitle">
        {testMode
          ? "Full dashboard with demo data — walk through consult → prep → practice file → post-filing."
          : "Bankruptcy matters — same buttons your staff already knows."}
      </p>

      <div className="dashboard-tiles">
        <Link href={appHref("/matters")} className="dashboard-tile">
          <div className="dashboard-tile__value">{total}</div>
          <div className="dashboard-tile__label">{testMode ? "Demo matters" : "Total matters"}</div>
        </Link>
        <Link href={appHref("/matters")} className="dashboard-tile">
          <div className="dashboard-tile__value">{unread}</div>
          <div className="dashboard-tile__label">Unread portal msgs</div>
        </Link>
        <Link href={appHref("/matters")} className="dashboard-tile">
          <div className="dashboard-tile__value">{pendingSync}</div>
          <div className="dashboard-tile__label">Docs to apply</div>
        </Link>
        <Link href={appHref("/matters")} className="dashboard-tile">
          <div className="dashboard-tile__value">{scouts}</div>
          <div className="dashboard-tile__label">Initial consult pending</div>
        </Link>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {testMode ? (
          <Link href={appHref("/matters/demo/scout")} className="app-btn app-btn--primary">
            Start test walkthrough →
          </Link>
        ) : (
          <Link href={appHref("/matters/new")} className="app-btn app-btn--primary">
            + New Matter
          </Link>
        )}
        <Link href={appHref("/matters")} className="app-btn app-btn--secondary">
          All Matters
        </Link>
        {!testMode && (
          <>
            <Link href={appHref("/mobile/install")} className="app-btn app-btn--tonal">
              Install {BRAND.reliefPocket.name}
            </Link>
          </>
        )}
      </div>

      {testMode && (
        <p className="text-sm text-muted-foreground">
          Tip: turn walkthrough prompts off in the red TEST bar anytime. Integrations live under{" "}
          <Link href={appHref("/settings")} className="matters-page__inbox-link">
            Settings
          </Link>
          .
        </p>
      )}

      {!testMode && (
        <p className="text-sm text-muted-foreground">
          Footer:{" "}
          <Link href={appHref("/field-capture")} className="matters-page__inbox-link">
            Field capture →
          </Link>{" "}
          ·{" "}
          <Link href={appHref("/matters")} className="matters-page__inbox-link">
            Matters list →
          </Link>
        </p>
      )}
    </main>
  );
}
