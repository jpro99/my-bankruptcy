"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MatterNotesRecordingPanel from "@/components/field-capture/matter-notes-recording-panel";
import { BankruptcyCalendarPanel } from "@/components/field-capture/bankruptcy-calendar-panel";
import {
  fetchMatterNotes,
  listDemoMatters,
  sendPortalInvite,
  type DemoMatterSummary,
  type MatterNote,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";

const LS_MATTER_KEY = "fieldCapture.matterId";

type PortalLinkResult = {
  status: "success" | "warning" | "error";
  message: string;
  link?: string;
  detail?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function noteTitle(note: MatterNote): string {
  const m = /^\*\*(.+)\*\*/.exec(note.text.trim());
  if (m) return m[1];
  if (note.source === "voice") return "Voice note";
  return note.authorLabel || "Note";
}

function noteBody(note: MatterNote): string {
  return note.text.replace(/^\*\*.+\*\*\n*/m, "").trim();
}

type View = "pick" | "home" | "record" | "notes" | "calendar";

export default function FieldCaptureClient() {
  const searchParams = useSearchParams();
  const [matters, setMatters] = useState<DemoMatterSummary[]>([]);
  const [mattersLoading, setMattersLoading] = useState(true);
  const [mattersErr, setMattersErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [matterId, setMatterId] = useState<string | null>(null);
  const [view, setView] = useState<View>("pick");
  const [notes, setNotes] = useState<MatterNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesErr, setNotesErr] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [printBusy, setPrintBusy] = useState(false);
  const [portalRecipient, setPortalRecipient] = useState("");
  const [portalChannel, setPortalChannel] = useState<"email" | "sms">("email");
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalResult, setPortalResult] = useState<PortalLinkResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMattersLoading(true);
      setMattersErr(null);
      try {
        const data = await listDemoMatters();
        if (cancelled) return;
        setMatters(data.matters);
      } catch (e) {
        if (!cancelled) {
          setMattersErr(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setMattersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initFromUrlOrStorage = useCallback(() => {
    const q = searchParams.get("matter");
    if (q?.trim()) {
      setMatterId(q.trim());
      setView("home");
      try {
        localStorage.setItem(LS_MATTER_KEY, q.trim());
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

  useEffect(() => {
    initFromUrlOrStorage();
  }, [initFromUrlOrStorage]);

  const filteredMatters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return matters;
    return matters.filter(
      (m) =>
        m.matterId.toLowerCase().includes(q) ||
        m.debtorDisplayName.toLowerCase().includes(q)
    );
  }, [matters, query]);

  const selectMatter = (id: string) => {
    setMatterId(id);
    setView("home");
    try {
      localStorage.setItem(LS_MATTER_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const matterLabel = useMemo(() => {
    if (!matterId) return "";
    const m = matters.find((x) => x.matterId === matterId);
    return m?.debtorDisplayName ?? matterId;
  }, [matters, matterId]);

  const loadNotes = useCallback(async () => {
    if (!matterId) return;
    setNotesLoading(true);
    setNotesErr(null);
    try {
      const data = await fetchMatterNotes(matterId);
      setNotes([...data.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e) {
      setNotesErr(e instanceof Error ? e.message : String(e));
    } finally {
      setNotesLoading(false);
    }
  }, [matterId]);

  const createPortalLink = useCallback(
    async (mode: "create" | "resend") => {
      if (!matterId) return;
      const recipient = portalRecipient.trim();
      if (!recipient) {
        setPortalResult({
          status: "error",
          message:
            portalChannel === "email"
              ? "Enter the client's email first."
              : "Enter the client's phone number first.",
        });
        return;
      }
      setPortalBusy(true);
      setPortalResult(null);
      try {
        const data = await sendPortalInvite(matterId, {
          channel: portalChannel,
          recipient,
          clientName: matterLabel || undefined,
        });
        const action = mode === "resend" ? "Fresh portal link" : "Portal link";
        if (data.ok && data.link) {
          if (data.mailto && portalChannel === "email") {
            setPortalResult({
              status: "warning",
              message: `${action} ready — email not auto-sent; use mailto or copy link.`,
              link: data.link,
              detail: data.message,
            });
            window.location.href = data.mailto;
          } else {
            setPortalResult({
              status: "success",
              message:
                portalChannel === "email"
                  ? `${action} emailed to ${recipient}.`
                  : `${action} created. Copy it and text it to ${recipient}.`,
              link: data.link,
            });
          }
        } else {
          setPortalResult({
            status: "error",
            message: data.message ?? "Could not create portal link.",
          });
        }
      } catch (e) {
        setPortalResult({
          status: "error",
          message: e instanceof Error ? e.message : "Network error",
        });
      } finally {
        setPortalBusy(false);
      }
    },
    [matterId, matterLabel, portalChannel, portalRecipient]
  );

  const copyPortalLink = useCallback(async () => {
    if (!portalResult?.link) return;
    try {
      await navigator.clipboard.writeText(portalResult.link);
      setPortalResult((prev) =>
        prev ? { ...prev, message: `${prev.message} Link copied.` } : prev
      );
    } catch {
      setPortalResult((prev) =>
        prev
          ? { ...prev, detail: "Copy failed. Tap the link box and copy manually." }
          : prev
      );
    }
  }, [portalResult?.link]);

  const printQuickReadTimeline = useCallback(async () => {
    if (!matterId) return;
    const w = window.open("", "_blank");
    if (!w) {
      window.alert(
        "Could not open print window. Allow pop-ups for this site, then try again."
      );
      return;
    }
    setPrintBusy(true);
    w.document.open();
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Loading…</title></head><body style="font-family:system-ui;padding:1rem;color:#64748b">Loading notes…</body></html>`
    );
    w.document.close();
    try {
      const data = await fetchMatterNotes(matterId);
      const entries = [...data.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const label = matterLabel || matterId;
      const printedAt = new Date().toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      });
      const blocks = entries
        .map((e) => {
          const when = new Date(e.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });
          const src = e.authorLabel ? ` · ${escapeHtml(e.authorLabel)}` : "";
          const body = noteBody(e);
          return `<article class="note">
  <div class="meta">${escapeHtml(when)}${src}</div>
  <h2>${escapeHtml(noteTitle(e))}</h2>
  ${body ? `<div class="body">${escapeHtml(body)}</div>` : ""}
</article>`;
        })
        .join("\n");

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(label)} — Timeline</title>
  <style>
    @page { margin: 0.6in 0.55in; }
    body { font-family: Georgia, "Times New Roman", serif; color: #111; line-height: 1.45; font-size: 11pt; }
    h1 { font-size: 15pt; margin: 0 0 0.25rem; font-family: system-ui, sans-serif; }
    .sub { font-size: 9.5pt; color: #444; margin: 0 0 1.25rem; font-family: system-ui, sans-serif; }
    .note { page-break-inside: avoid; margin-bottom: 1.1rem; padding-bottom: 0.85rem; border-bottom: 1px solid #ccc; }
    .note:last-child { border-bottom: none; }
    .meta { font-size: 9pt; color: #555; margin-bottom: 0.2rem; font-family: system-ui, sans-serif; }
    .note h2 { font-size: 12pt; margin: 0 0 0.35rem; font-weight: 700; }
    .body { white-space: pre-wrap; margin: 0; }
    .empty { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>${escapeHtml(label)}</h1>
  <p class="sub">Matter ${escapeHtml(matterId)} · Printed ${escapeHtml(printedAt)} · Bankruptcy field capture</p>
  ${entries.length === 0 ? '<p class="empty">No timeline entries yet for this matter.</p>' : blocks}
</body>
</html>`;

      w.document.open();
      w.document.write(html);
      w.document.close();
      const triggerPrint = () => {
        try {
          w.focus();
          w.print();
        } catch {
          /* ignore */
        }
      };
      if (w.document.readyState === "complete") {
        triggerPrint();
      } else {
        w.onload = triggerPrint;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load notes for printing.";
      try {
        w.document.open();
        w.document.write(
          `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:system-ui;padding:1rem;color:#b91c1c">${escapeHtml(msg)}</body></html>`
        );
        w.document.close();
      } catch {
        window.alert(msg);
      }
    } finally {
      setPrintBusy(false);
    }
  }, [matterId, matterLabel]);

  useEffect(() => {
    if (view === "notes" && matterId) {
      void loadNotes();
    }
  }, [view, matterId, loadNotes, refreshToken]);

  return (
    <div
      className={`field-capture-shell${
        view === "home" && matterId ? " field-capture-shell--drive-home" : ""
      }`}
    >
      <header
        className={`field-capture-header${
          view === "home" && matterId ? " field-capture-header--compact" : ""
        }`}
      >
        <h1 className="field-capture-title">Field capture</h1>
        <p className="field-capture-sub">
          Bankruptcy matter → record → saves to {BRAND.benchNotes.name.toLowerCase()} / timeline in the main app.
        </p>
      </header>

      {view === "pick" && (
        <section className="field-capture-card">
          <label className="field-capture-label" htmlFor="fc-search">
            Find a bankruptcy matter
          </label>
          <input
            id="fc-search"
            className="field-capture-input"
            type="search"
            enterKeyHint="search"
            placeholder="Debtor name or matter id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {mattersLoading ? (
            <p className="field-capture-muted">Loading matters…</p>
          ) : mattersErr ? (
            <p className="field-capture-error">{mattersErr}</p>
          ) : (
            <ul className="field-capture-matter-list">
              {filteredMatters.slice(0, 80).map((m) => (
                <li key={m.matterId}>
                  <button
                    type="button"
                    className="field-capture-matter-btn"
                    onClick={() => selectMatter(m.matterId)}
                  >
                    <span className="field-capture-matter-id">{m.matterId}</span>
                    <span className="field-capture-matter-title">
                      {m.debtorDisplayName}
                      {m.chapter ? ` · Ch ${m.chapter}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!mattersLoading && filteredMatters.length > 80 ? (
            <p className="field-capture-muted">
              Showing first 80 matches — type more to narrow.
            </p>
          ) : null}
        </section>
      )}

      {view !== "pick" && matterId && (
        <>
          <div className="field-capture-matter-bar">
            <div className="field-capture-matter-bar__text">
              <span className="field-capture-matter-bar__label">Selected</span>
              <span className="field-capture-matter-bar__name">{matterLabel}</span>
            </div>
            <button
              type="button"
              className="field-capture-text-btn"
              onClick={() => {
                setView("pick");
                setQuery("");
              }}
            >
              Change
            </button>
          </div>

          {view === "home" && (
            <>
              <div className="field-capture-actions field-capture-actions--drive">
                <button
                  type="button"
                  className="field-capture-big-btn field-capture-big-btn--record"
                  onClick={() => setView("record")}
                >
                  <span className="field-capture-big-btn__icon" aria-hidden>
                    ●
                  </span>
                  Record note or call
                </button>
                <p className="field-capture-hint field-capture-hint--drive">
                  After recording, tap Stop — we transcribe and add a timeline entry (same as the
                  main app).
                </p>
                <button
                  type="button"
                  className="field-capture-big-btn field-capture-big-btn--notes"
                  onClick={() => {
                    setNotesErr(null);
                    setNotesLoading(true);
                    setView("notes");
                  }}
                >
                  <span className="field-capture-big-btn__icon" aria-hidden>
                    ≡
                  </span>
                  Read timeline for this matter
                </button>
                <p className="field-capture-hint field-capture-hint--drive">
                  Opens notes already on file — nothing is edited here.
                </p>
                <button
                  type="button"
                  className="field-capture-big-btn field-capture-big-btn--calendar"
                  onClick={() => setView("calendar")}
                >
                  <span className="field-capture-big-btn__icon" aria-hidden>
                    📅
                  </span>
                  Add to Google Calendar
                </button>
                <p className="field-capture-hint field-capture-hint--drive">
                  341 meetings, doc deadlines, consults, filing targets — pre-filled for bankruptcy.
                </p>
              </div>
              <details className="field-capture-card field-capture-portal-card field-capture-portal-collapsible">
                <summary className="field-capture-portal-summary">
                  Client portal (optional)
                </summary>
                <p className="field-capture-hint">
                  Create or resend a secure {BRAND.clientPortal.linkLabel} for this bankruptcy matter. Use when
                  the client forgot the link.
                </p>
                <div className="field-capture-portal-grid">
                  <label className="field-capture-label">
                    Delivery
                    <select
                      className="field-capture-input"
                      value={portalChannel}
                      onChange={(e) => {
                        setPortalChannel(e.target.value as "email" | "sms");
                        setPortalResult(null);
                      }}
                    >
                      <option value="email">Email</option>
                      <option value="sms">Text/copy link</option>
                    </select>
                  </label>
                  <label className="field-capture-label">
                    {portalChannel === "email" ? "Client email" : "Client phone"}
                    <input
                      className="field-capture-input"
                      type={portalChannel === "email" ? "email" : "tel"}
                      inputMode={portalChannel === "email" ? "email" : "tel"}
                      autoComplete={portalChannel === "email" ? "email" : "tel"}
                      value={portalRecipient}
                      onChange={(e) => {
                        setPortalRecipient(e.target.value);
                        setPortalResult(null);
                      }}
                      placeholder={
                        portalChannel === "email"
                          ? "client@example.com"
                          : "+1 555-555-5555"
                      }
                    />
                  </label>
                </div>
                <div className="field-capture-portal-actions">
                  <button
                    type="button"
                    className="field-capture-small-btn field-capture-small-btn--primary"
                    disabled={portalBusy || !portalRecipient.trim()}
                    onClick={() => void createPortalLink("create")}
                  >
                    {portalBusy ? "Working…" : "Create portal link"}
                  </button>
                  <button
                    type="button"
                    className="field-capture-small-btn"
                    disabled={portalBusy || !portalRecipient.trim()}
                    onClick={() => void createPortalLink("resend")}
                  >
                    Resend portal link
                  </button>
                </div>
                {portalResult ? (
                  <div
                    className={`field-capture-portal-result field-capture-portal-result--${portalResult.status}`}
                  >
                    <strong>{portalResult.message}</strong>
                    {portalResult.detail ? <p>{portalResult.detail}</p> : null}
                    {portalResult.link ? (
                      <>
                        <input
                          className="field-capture-input field-capture-portal-link"
                          readOnly
                          value={portalResult.link}
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          type="button"
                          className="field-capture-small-btn"
                          onClick={() => void copyPortalLink()}
                        >
                          Copy link
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </details>
            </>
          )}

          {view === "record" && (
            <section className="field-capture-card field-capture-record-wrap">
              <button type="button" className="field-capture-back" onClick={() => setView("home")}>
                ← Back
              </button>
              <MatterNotesRecordingPanel
                matterId={matterId}
                onComplete={() => {
                  setRefreshToken((t) => t + 1);
                }}
              />
            </section>
          )}

          {view === "calendar" && (
            <BankruptcyCalendarPanel
              matterId={matterId}
              matterLabel={matterLabel}
              onBack={() => setView("home")}
            />
          )}

          {view === "notes" && (
            <section className="field-capture-card">
              <button type="button" className="field-capture-back" onClick={() => setView("home")}>
                ← Back
              </button>
              {notesLoading ? (
                <p className="field-capture-muted">Loading timeline…</p>
              ) : notesErr ? (
                <p className="field-capture-error">{notesErr}</p>
              ) : notes.length === 0 ? (
                <p className="field-capture-muted">No timeline entries yet.</p>
              ) : (
                <ul className="field-capture-notes-list">
                  {notes.map((e) => (
                    <li key={e.id} className="field-capture-note-item">
                      <div className="field-capture-note-item__meta">
                        {new Date(e.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {e.authorLabel ? (
                          <span className="field-capture-note-source"> · {e.authorLabel}</span>
                        ) : null}
                      </div>
                      <h2 className="field-capture-note-title">{noteTitle(e)}</h2>
                      {noteBody(e) && (
                        <p className="field-capture-note-body">{noteBody(e)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <footer className="field-capture-footer">
        <div className="field-capture-footer__row">
          <Link href="/matters" className="field-capture-link">
            Full app (matters)
          </Link>
          <span className="field-capture-footer__sep">·</span>
          <span className="field-capture-muted field-capture-footer__hint">
            Bookmark this page or Add to Home Screen.
          </span>
        </div>
        {matterId ? (
          <div className="field-capture-footer__row field-capture-footer__row--second">
            <button
              type="button"
              className="field-capture-print-quick-btn"
              disabled={printBusy}
              onClick={() => void printQuickReadTimeline()}
            >
              {printBusy ? "Preparing print…" : "Print timeline (quick read)"}
            </button>
            <p className="field-capture-print-quick-hint">
              Opens a clean page with this matter&apos;s notes — use your phone&apos;s print or
              share to PDF for the attorney.
            </p>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
