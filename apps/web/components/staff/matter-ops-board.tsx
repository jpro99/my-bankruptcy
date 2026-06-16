"use client";

import Link from "next/link";
import { Printer, Search } from "lucide-react";
import { listDemoMatters, type DemoMatterSummary } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import {
  filterMatters,
  formatPhoneDisplay,
  MATTER_LIFECYCLE_TABS,
  type MatterLifecycle,
} from "@/lib/matter-search";
import { useTestMode } from "@/lib/test-mode";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function lifecycleBadge(stage?: DemoMatterSummary["lifecycleStage"]): string {
  if (stage === "completed") return "Completed";
  if (stage === "active") return "Active";
  return "Potential";
}

export function MatterOpsBoard() {
  const { testMode, appHref } = useTestMode();
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<"all" | MatterLifecycle>("all");

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

  const filtered = useMemo(
    () => filterMatters(matters, { query, lifecycle }),
    [matters, query, lifecycle]
  );

  const counts = useMemo(() => {
    const base = { all: matters.length, potential: 0, active: 0, completed: 0 };
    for (const m of matters) {
      const stage = m.lifecycleStage ?? (m.status === "prospect" ? "potential" : "active");
      base[stage] += 1;
    }
    return base;
  }, [matters]);

  if (loading) return <p>Loading matters…</p>;

  return (
    <div className="matter-ops-board">
      <div className="matter-ops-board__toolbar">
        <label className="matter-ops-board__search">
          <Search className="matter-ops-board__search-icon" aria-hidden />
          <input
            type="search"
            className="matter-ops-board__search-input"
            placeholder="Search name, phone, or email — instant find"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        <div className="matter-ops-board__tabs" role="tablist" aria-label="Matter lifecycle">
          {MATTER_LIFECYCLE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={lifecycle === tab.id}
              title={tab.hint}
              className={`matter-ops-board__tab${lifecycle === tab.id ? " matter-ops-board__tab--active" : ""}`}
              onClick={() => setLifecycle(tab.id)}
            >
              {tab.label}
              <span className="matter-ops-board__tab-count">{counts[tab.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {matters.length === 0 ? (
        <div className="matters-page__empty">
          No matters yet.{" "}
          {!testMode && (
            <Link href={appHref("/matters/new")} className="matters-page__inbox-link">
              Create one →
            </Link>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="matters-page__empty">
          No matches for &ldquo;{query}&rdquo;
          {lifecycle !== "all" ? ` in ${lifecycle} matters` : ""}.{" "}
          <button type="button" className="matters-page__inbox-link" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      ) : (
        <ul className="matter-ops-list">
          {filtered.map((m) => (
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
                    {(m.clientPhone || m.clientEmail) && (
                      <p className="matter-ops-card__contact">
                        {formatPhoneDisplay(m.clientPhone) ?? m.clientPhone}
                        {m.clientPhone && m.clientEmail ? " · " : ""}
                        {m.clientEmail}
                      </p>
                    )}
                  </div>
                  <div className="matter-ops-card__badges">
                    <span
                      className={`matter-ops-card__lifecycle matter-ops-card__lifecycle--${m.lifecycleStage ?? "potential"}`}
                    >
                      {lifecycleBadge(m.lifecycleStage)}
                    </span>
                    <span
                      className={`matter-ops-card__phase matter-ops-card__phase--${m.currentPhase ?? "prep"}`}
                    >
                      {phaseLabel(m.currentPhase)}
                    </span>
                  </div>
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
                  href={appHref(`/matters/${m.matterId}/billing`)}
                  className="app-btn app-btn--tonal app-btn--sm"
                  title="Print receipt"
                >
                  <Printer className="size-3.5" aria-hidden />
                  Receipt
                </Link>
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
                  {m.lifecycleStage === "completed"
                    ? "Closure"
                    : m.status === "filed"
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
      )}
    </div>
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
