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
      <div className="matters-page__header-row">
        <div className="matters-page__header">
          <h1 className="matters-page__title">All Matters</h1>
          <p className="matters-page__subtitle">
            Every bankruptcy case — open a matter to message clients, review documents, and file.
          </p>
        </div>
        <Link href="/matters/new" className="app-btn app-btn--primary">
          + New Matter
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
                <th>Client / Matter</th>
                <th>Contact</th>
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
                    <strong>{m.debtorDisplayName}</strong>
                    <br />
                    <span style={{ fontSize: "0.72rem", color: "var(--app-chrome-text-muted)" }}>{m.matterId}</span>
                  </td>
                  <td>
                    {m.clientEmail ?? "—"}
                    {m.clientPhone && (
                      <>
                        <br />
                        <span style={{ fontSize: "0.72rem" }}>{m.clientPhone}</span>
                      </>
                    )}
                  </td>
                  <td>Ch {m.chapter}</td>
                  <td>{m.status}</td>
                  <td className="matters-table__actions">
                    {!m.consultComplete ? (
                      <Link
                        href={`/matters/${m.matterId}/scout`}
                        className="matters-table__action-link matters-table__action-link--accent"
                      >
                        Scout
                      </Link>
                    ) : m.status === "filed" ? (
                      <Link
                        href={`/matters/${m.matterId}/continuum`}
                        className="matters-table__action-link matters-table__action-link--accent"
                      >
                        Continuum
                      </Link>
                    ) : (
                      <Link
                        href={`/matters/${m.matterId}/forge`}
                        className="matters-table__action-link matters-table__action-link--accent"
                      >
                        Forge
                      </Link>
                    )}
                    <Link href={`/matters/${m.matterId}`} className="matters-table__action-link">
                      Open
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
