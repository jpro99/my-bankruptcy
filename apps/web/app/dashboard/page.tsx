"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listDemoMatters, type DemoMatterSummary } from "@/lib/api-client";
import { StaffHeader } from "@/components/staff/staff-header";
import { IntegrationsPanel } from "@/components/staff/integrations-panel";
import "@/styles/staff-chrome.css";

export default function DashboardPage() {
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);

  const load = useCallback(async () => {
    const data = await listDemoMatters();
    setMatters(data.matters);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = matters.length;
  const pendingSync = matters.reduce((a, m) => a + m.pendingDocuments, 0);
  const unread = matters.reduce((a, m) => a + (m.unreadPortalMessages ?? 0), 0);
  const scouts = matters.filter((m) => !m.consultComplete).length;

  return (
    <div className="app-container">
      <StaffHeader />
      <main>
        <h1 className="matters-page__title">Firm command center</h1>
        <p className="matters-page__subtitle">Bankruptcy matters — same buttons your staff already knows.</p>

        <div className="dashboard-tiles">
          <Link href="/matters" className="dashboard-tile">
            <div className="dashboard-tile__value">{total}</div>
            <div className="dashboard-tile__label">Total matters</div>
          </Link>
          <Link href="/matters" className="dashboard-tile">
            <div className="dashboard-tile__value">{unread}</div>
            <div className="dashboard-tile__label">Unread portal msgs</div>
          </Link>
          <Link href="/matters" className="dashboard-tile">
            <div className="dashboard-tile__value">{pendingSync}</div>
            <div className="dashboard-tile__label">Docs to Forge Sync</div>
          </Link>
          <Link href="/matters" className="dashboard-tile">
            <div className="dashboard-tile__value">{scouts}</div>
            <div className="dashboard-tile__label">Relief Scout pending</div>
          </Link>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <Link href="/matters/new" className="app-btn app-btn--primary">
            + New Matter
          </Link>
          <Link href="/matters" className="app-btn app-btn--secondary">
            All Matters
          </Link>
          <Link href="/field-capture" className="app-btn app-btn--secondary">
            Field capture (phone)
          </Link>
          <Link href="/mobile/install" className="app-btn app-btn--tonal">
            Install Relief Pocket
          </Link>
        </div>

        <section style={{ marginBottom: "1.5rem" }}>
          <IntegrationsPanel />
        </section>

        <p className="text-sm text-muted-foreground">
          Footer:{" "}
          <Link href="/field-capture" className="matters-page__inbox-link">
            Field capture →
          </Link>{" "}
          ·{" "}
          <Link href="/matters" className="matters-page__inbox-link">
            Matters list →
          </Link>
        </p>
      </main>
    </div>
  );
}
