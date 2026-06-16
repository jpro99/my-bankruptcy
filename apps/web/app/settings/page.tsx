"use client";

import { StaffHeader } from "@/components/staff/staff-header";
import { IntegrationsPanel } from "@/components/staff/integrations-panel";
import { DistrictCourtReadiness } from "@/components/filing/district-court-readiness";
import "@/styles/staff-chrome.css";
import "@/styles/court-form.css";

export default function SettingsPage() {
  return (
    <div className="app-container">
      <StaffHeader />
      <main>
        <h1 className="matters-page__title">Settings</h1>
        <p className="matters-page__subtitle">
          Integrations and court connections — staff only, not on the main dashboard.
        </p>

        <section style={{ marginBottom: "2rem" }}>
          <IntegrationsPanel />
        </section>

        <section>
          <h2 className="matters-page__subtitle">Riverside County court readiness</h2>
          <DistrictCourtReadiness matterId="demo" />
        </section>
      </main>
    </div>
  );
}
