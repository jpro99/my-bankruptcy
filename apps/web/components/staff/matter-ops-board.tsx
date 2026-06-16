"use client";

import Link from "next/link";
import { listDemoMatters, type DemoMatterSummary } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { useTestMode } from "@/lib/test-mode";
import { useCallback, useEffect, useState } from "react";

function formatContact(m: DemoMatterSummary): string {
  if ((m.unreadPortalMessages ?? 0) > 0) {
    return `${m.unreadPortalMessages} unread portal msg${m.unreadPortalMessages === 1 ? "" : "s"}`;
  }
  if (m.lastContactAt) {
    const when = new Date(m.lastContactAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return m.lastContactKind === "portal" ? `Portal · ${when}` : `Note · ${when}`;
  }
  return "No contact logged";
}

function phaseLabel(phase?: DemoMatterSummary["currentPhase"]): string {
  if (phase === "consult") return "Initial Consult";
  if (phase === "prep") return "Petition Prep";
  if (phase === "file") return "Ready to file";
  if (phase === "post-filing") return "Post-Filing";
  return "—";
}

export function MatterOpsBoard() {
  const { testMode, appHref } = useTestMode();
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDemoMatters();
      const list = testMode
        ? data.matters.filter((m) => m.matterId.startsWith("demo"))
        : data.matters;
      setMatters(list);
    } finally {
      setLoading(false);
    }
  }, [testMode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p>Loading matters…</p>;

  if (matters.length === 0) {
    return (
      <div className="matters-page__empty">
        No matters yet.{" "}
        {!testMode && (
          <Link href={appHref("/matters/new")} className="matters-page__inbox-link">
            Create one →
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="matter-ops-list">
      {matters.map((m) => (
        <li key={m.matterId} className="matter-ops-card">
          <div className="matter-ops-card__main">
            <div className="matter-ops-card__head">
              <div>
                <Link href={appHref(`/matters/${m.matterId}`)} className="matter-ops-card__name">
                  {m.debtorDisplayName}
                </Link>
                <p className="matter-ops-card__meta">
                  Ch {m.chapter}
                  {m.county ? ` · ${m.county}` : ""}
                  {m.divisionName ? ` · ${m.divisionName}` : ""}
                </p>
              </div>
              <span className={`matter-ops-card__phase matter-ops-card__phase--${m.currentPhase ?? "prep"}`}>
                {phaseLabel(m.currentPhase)}
              </span>
            </div>

            <div className="matter-ops-card__progress">
              <div className="matter-ops-card__progress-labels">
                <span>{m.overallPercent ?? 0}% complete</span>
                <span>{m.currentStep ?? "—"}</span>
              </div>
              <div className="matter-ops-card__progress-track" aria-hidden>
                <div
                  className="matter-ops-card__progress-fill"
                  style={{ width: `${m.overallPercent ?? 0}%` }}
                />
              </div>
            </div>

            <div className="matter-ops-card__stats">
              <div>
                <span className="matter-ops-card__stat-label">Contact</span>
                <span className="matter-ops-card__stat-value">{formatContact(m)}</span>
              </div>
              <div>
                <span className="matter-ops-card__stat-label">Fees</span>
                <span
                  className={`matter-ops-card__stat-value${m.paidInFull ? " matter-ops-card__stat-value--paid" : ""}`}
                >
                  {m.paidInFull ? "Paid in full" : `$${m.balanceDue ?? "—"} due`}
                </span>
              </div>
              <div>
                <span className="matter-ops-card__stat-label">Docs</span>
                <span className="matter-ops-card__stat-value">
                  {m.pendingDocuments > 0 ? `${m.pendingDocuments} to apply` : "Synced"}
                </span>
              </div>
            </div>
          </div>

          <div className="matter-ops-card__actions">
            <Link
              href={appHref(
                !m.consultComplete
                  ? `/matters/${m.matterId}/scout`
                  : m.status === "filed"
                    ? `/matters/${m.matterId}/continuum`
                    : `/matters/${m.matterId}/forge`
              )}
              className="app-btn app-btn--primary app-btn--sm"
            >
              {m.status === "filed"
                ? BRAND.continuum.short
                : !m.consultComplete
                  ? BRAND.reliefScout.short
                  : "Continue"}
            </Link>
            <button
              type="button"
              className="app-btn app-btn--tonal app-btn--sm"
              onClick={() => setExpanded(expanded === m.matterId ? null : m.matterId)}
            >
              All tools
            </button>
          </div>

          {expanded === m.matterId && (
            <MatterToolLinks matterId={m.matterId} appHref={appHref} />
          )}
        </li>
      ))}
    </ul>
  );
}

function MatterToolLinks({
  matterId,
  appHref,
}: {
  matterId: string;
  appHref: (path: string) => string;
}) {
  const tools = [
    { label: BRAND.command.name, href: `/matters/${matterId}/command`, icon: "📊" },
    { label: BRAND.reliefScout.short, href: `/matters/${matterId}/scout`, icon: "🎯" },
    { label: BRAND.forge.name, href: `/matters/${matterId}/forge`, icon: "⚒️" },
    { label: BRAND.practiceMode.short, href: `/matters/${matterId}/practice`, icon: "🧪" },
    { label: "Schedules", href: `/matters/${matterId}/forge?section=schedules`, icon: "📊" },
    { label: BRAND.trustLedger.name, href: `/matters/${matterId}/billing`, icon: "💰" },
    { label: BRAND.clientPortal.name, href: `/matters/${matterId}/forge?section=messages`, icon: "💬" },
    { label: BRAND.continuum.name, href: `/matters/${matterId}/continuum`, icon: "📅" },
    { label: "Audit", href: `/matters/${matterId}/audit`, icon: "🔍" },
  ];

  return (
    <div className="matter-ops-card__tools">
      {tools.map((t) => (
        <Link key={t.href} href={appHref(t.href)} className="matter-ops-card__tool">
          <span>{t.icon}</span>
          {t.label}
        </Link>
      ))}
      <Link
        href={`/field-capture?matter=${matterId}`}
        className="matter-ops-card__tool matter-ops-card__tool--phone"
      >
        <span>📱</span>
        Field capture (phone)
      </Link>
    </div>
  );
}
