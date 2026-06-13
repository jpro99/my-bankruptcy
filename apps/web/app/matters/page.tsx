"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listDemoMatters, type DemoMatterSummary } from "@/lib/api-client";
import { StaffHeader } from "@/components/staff/staff-header";
import "@/styles/staff-chrome.css";

export default function MattersListPage() {
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDemoMatters();
      setMatters(data.matters);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="app-container">
      <StaffHeader />
    <main className="matters-page">
      <div className="matters-page__header">
        <h1 className="matters-page__title">Matters</h1>
        <p className="matters-page__subtitle">
          Select a case to open its matter page — same layout as Demand Generator, built for
          bankruptcy.
        </p>
        <Link href="/field-capture" className="matters-page__inbox-link">
          Field capture (phone notes) →
        </Link>
      </div>

      {loading ? (
        <p>Loading matters…</p>
      ) : matters.length === 0 ? (
        <div className="matters-page__empty">
          No matters yet.{" "}
          <Link href="/matters/new" className="matters-page__inbox-link">
            Create one →
          </Link>
        </div>
      ) : (
        <div className="matters-table-wrap">
          <table className="matters-table">
            <thead>
              <tr>
                <th>Matter</th>
                <th>Client</th>
                <th>Chapter</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr key={m.matterId}>
                  <td>
                    {(m.unreadPortalMessages ?? 0) > 0 && (
                      <span
                        className="matters-table__portal-msg-dot"
                        title="Unread client portal message(s)"
                      />
                    )}
                    {m.matterId}
                  </td>
                  <td>{m.debtorDisplayName}</td>
                  <td>Ch {m.chapter}</td>
                  <td>{m.status}</td>
                  <td className="matters-table__actions">
                    <Link href={`/matters/${m.matterId}`} className="matters-table__action-link">
                      Matter
                    </Link>
                    <Link
                      href={`/matters/${m.matterId}/forge`}
                      className="matters-table__action-link matters-table__action-link--accent"
                    >
                      Forge
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
    </div>
  );
}
