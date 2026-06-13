"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  addMatterNoteApi,
  fetchMatterDossier,
  listDemoMatters,
  sendPortalInvite,
  type DemoMatterSummary,
  type MatterNote,
} from "@/lib/api-client";
import {
  BANKRUPTCY_EVENT_TEMPLATES,
  buildGoogleCalendarUrl,
  type BankruptcyEventKind,
} from "@/lib/mobile-calendar";
import "@/styles/staff-chrome.css";

const LS_MATTER_KEY = "fieldCapture.matterId";

type View = "pick" | "home" | "record" | "notes" | "calendar";

export default function FieldCapturePage() {
  return (
    <div className="field-capture-layout-root">
      <Suspense fallback={<div className="field-capture-shell">Loading…</div>}>
        <FieldCaptureInner />
      </Suspense>
    </div>
  );
}

function FieldCaptureInner() {
  const searchParams = useSearchParams();
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);
  const [query, setQuery] = useState("");
  const [matterId, setMatterId] = useState<string | null>(null);
  const [view, setView] = useState<View>("pick");
  const [notes, setNotes] = useState<MatterNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [portalRecipient, setPortalRecipient] = useState("");
  const [portalChannel, setPortalChannel] = useState<"email" | "sms">("email");
  const [portalStatus, setPortalStatus] = useState<string | null>(null);
  const [eventKind, setEventKind] = useState<BankruptcyEventKind>("follow_up");
  const [eventStart, setEventStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  useEffect(() => {
    void listDemoMatters().then((d) => setMatters(d.matters));
  }, []);

  useEffect(() => {
    const q = searchParams.get("matter");
    if (q) {
      setMatterId(q);
      setView("home");
      try {
        localStorage.setItem(LS_MATTER_KEY, q);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const s = localStorage.getItem(LS_MATTER_KEY);
      if (s) {
        setMatterId(s);
        setView("home");
      }
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return matters;
    return matters.filter(
      (m) => m.matterId.includes(q) || m.debtorDisplayName.toLowerCase().includes(q)
    );
  }, [matters, query]);

  const matterLabel = useMemo(() => {
    if (!matterId) return "";
    return matters.find((m) => m.matterId === matterId)?.debtorDisplayName ?? matterId;
  }, [matters, matterId]);

  const loadNotes = useCallback(async () => {
    if (!matterId) return;
    const d = await fetchMatterDossier(matterId);
    setNotes(d.dossier.notes);
  }, [matterId]);

  useEffect(() => {
    if (view === "notes" && matterId) void loadNotes();
  }, [view, matterId, loadNotes]);

  const saveNote = async () => {
    if (!matterId || !noteText.trim()) return;
    await addMatterNoteApi(matterId, noteText.trim(), "voice");
    setNoteText("");
    setView("home");
  };

  const sendPortal = async () => {
    if (!matterId) return;
    const res = await sendPortalInvite(matterId, {
      channel: portalChannel,
      recipient: portalRecipient,
      clientName: matterLabel,
    });
    setPortalStatus(res.message);
    if (res.mailto && portalChannel === "email") window.location.href = res.mailto;
  };

  return (
    <div className="field-capture-shell">
      <header className="field-capture-header">
        <h1 className="field-capture-title">Field capture</h1>
        <p className="field-capture-sub">
          Matter → record → saves to Notes / timeline (same as Demand Generator).
        </p>
        <Link href="/dashboard" className="field-capture-link">
          ← Dashboard
        </Link>
      </header>

      {view === "pick" && (
        <section className="field-capture-card">
          <label className="field-capture-label" htmlFor="fc-search">
            Find a matter
          </label>
          <input
            id="fc-search"
            className="field-capture-input"
            placeholder="Name or matter id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filtered.slice(0, 80).map((m) => (
              <li key={m.matterId}>
                <button
                  type="button"
                  className="field-capture-matter-btn"
                  onClick={() => {
                    setMatterId(m.matterId);
                    setView("home");
                    localStorage.setItem(LS_MATTER_KEY, m.matterId);
                  }}
                >
                  <span className="field-capture-matter-id">{m.matterId}</span>
                  <span>{m.debtorDisplayName}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {view !== "pick" && matterId && (
        <>
          <div className="field-capture-matter-bar">
            <div>
              <span className="field-capture-matter-bar__label">Selected</span>
              <span className="field-capture-matter-bar__name">{matterLabel}</span>
            </div>
            <button type="button" className="field-capture-text-btn" onClick={() => setView("pick")}>
              Change
            </button>
          </div>

          {view === "home" && (
            <>
              <button type="button" className="field-capture-big-btn field-capture-big-btn--record" onClick={() => setView("record")}>
                <span aria-hidden>●</span> Record note or call
              </button>
              <p className="field-capture-hint">Type or dictate — lands in Notes / timeline.</p>
              <button type="button" className="field-capture-big-btn field-capture-big-btn--notes" onClick={() => setView("notes")}>
                <span aria-hidden>≡</span> Read timeline for this matter
              </button>
              <button type="button" className="field-capture-big-btn field-capture-big-btn--calendar" onClick={() => setView("calendar")}>
                <span aria-hidden>📅</span> Add to Google Calendar
              </button>
              <details className="field-capture-portal-collapsible">
                <summary className="field-capture-portal-summary">Client portal (optional)</summary>
                <div className="field-capture-card field-capture-portal-card">
                  <select
                    className="field-capture-input"
                    value={portalChannel}
                    onChange={(e) => setPortalChannel(e.target.value as "email" | "sms")}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS (copy link manually)</option>
                  </select>
                  <input
                    className="field-capture-input"
                    placeholder={portalChannel === "email" ? "Client email" : "Client phone"}
                    value={portalRecipient}
                    onChange={(e) => setPortalRecipient(e.target.value)}
                  />
                  <button type="button" className="field-capture-big-btn field-capture-big-btn--notes" onClick={() => void sendPortal()}>
                    Send invitation
                  </button>
                  {portalStatus && <p className="field-capture-muted">{portalStatus}</p>}
                </div>
              </details>
            </>
          )}

          {view === "record" && (
            <section className="field-capture-card">
              <textarea
                className="field-capture-input"
                rows={5}
                placeholder="Note for this file…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button type="button" className="field-capture-big-btn field-capture-big-btn--record" onClick={() => void saveNote()}>
                Stop & save to timeline
              </button>
              <button type="button" className="field-capture-text-btn" onClick={() => setView("home")}>
                Cancel
              </button>
            </section>
          )}

          {view === "notes" && (
            <section className="field-capture-card">
              {notes.map((n) => (
                <div key={n.id} className="field-capture-note-row">
                  <time>{n.createdAt.slice(0, 16).replace("T", " ")}</time>
                  {n.text}
                </div>
              ))}
              <button type="button" className="field-capture-text-btn" onClick={() => setView("home")}>
                ← Back
              </button>
            </section>
          )}

          {view === "calendar" && (
            <section className="field-capture-card">
              <select
                className="field-capture-input"
                value={eventKind}
                onChange={(e) => setEventKind(e.target.value as BankruptcyEventKind)}
              >
                {Object.entries(BANKRUPTCY_EVENT_TEMPLATES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="field-capture-input"
                value={eventStart}
                onChange={(e) => setEventStart(e.target.value)}
              />
              <button
                type="button"
                className="field-capture-big-btn field-capture-big-btn--calendar"
                onClick={() => {
                  const tpl = BANKRUPTCY_EVENT_TEMPLATES[eventKind];
                  const url = buildGoogleCalendarUrl({
                    title: tpl.defaultTitle(matterLabel),
                    start: new Date(eventStart),
                    durationMin: tpl.defaultDurationMin,
                    details: tpl.defaultDetails(matterLabel, matterId),
                  });
                  window.open(url, "_blank");
                }}
              >
                Open Google Calendar
              </button>
              <button type="button" className="field-capture-text-btn" onClick={() => setView("home")}>
                ← Back
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
