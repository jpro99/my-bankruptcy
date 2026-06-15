"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyForgeSync,
  fetchMatterDossier,
  fetchMatterProfile,
  fetchPortalStaff,
  sendPortalInvite,
  sendPortalStaffMessage,
  type MatterNote,
  type PortalActivityEvent,
  type PortalMessage,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { ReliefScoutPanel } from "@/components/scout/relief-scout-panel";
import { MatterDossierPanel } from "@/components/intake/matter-dossier-panel";
import { FilingPacketPanel } from "@/components/filing/filing-packet-panel";
import { CommandCenter } from "@/components/command/command-center";
import { DocumentReviewPanel } from "@/components/workflow/document-review-panel";
import { FinalCheckPanel } from "@/components/workflow/final-check-panel";
import { MatterCalendarPanel } from "@/components/workflow/matter-calendar-panel";

const TABS = [
  { id: "command", label: "Relief Command", icon: "🎯" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "intake", label: "Intake", icon: "📋" },
  { id: "documents", label: "Documents", icon: "📁" },
  { id: "docReview", label: "Doc QA", icon: "✅" },
  { id: "finalCheck", label: "Final Check", icon: "👍" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "forge", label: BRAND.forge.name, icon: "🔨" },
  { id: "filing", label: "Filing packet", icon: "📦" },
  { id: "financials", label: BRAND.trustLedger.name, icon: "💰" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PortalStaffTab({ matterId, defaultPanel = "messages" }: { matterId: string; defaultPanel?: "activity" | "invite" | "messages" }) {
  const [panel, setPanel] = useState<"activity" | "invite" | "messages">(defaultPanel);
  const [activity, setActivity] = useState<PortalActivityEvent[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [portalUrl, setPortalUrl] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [recipient, setRecipient] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchPortalStaff(matterId);
    setActivity(data.activity);
    setMessages(data.messages);
    setPortalUrl(data.portalUrl);
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchMatterProfile(matterId).then((p) => {
      if (p.profile.clientEmail) setRecipient(p.profile.clientEmail);
    });
  }, [matterId]);

  const sendInvite = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await sendPortalInvite(matterId, { channel, recipient });
      setStatus(res.message);
      if (res.mailto && channel === "email") {
        window.location.href = res.mailto;
      }
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await sendPortalStaffMessage(matterId, reply.trim());
      setReply("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="demand-preview-mode-toggle">
        {(["activity", "invite", "messages"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`demand-preview-mode-toggle__btn${panel === p ? " demand-preview-mode-toggle__btn--active" : ""}`}
            onClick={() => setPanel(p)}
          >
            {p === "activity" ? "Activity" : p === "invite" ? "Send Invite" : "Messages"}
            {p === "messages" &&
              messages.filter((m) => m.direction === "inbound" && !m.readAt).length > 0 &&
              ` (${messages.filter((m) => m.direction === "inbound" && !m.readAt).length})`}
          </button>
        ))}
      </div>

      {panel === "activity" && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No portal activity yet.</p>
          ) : (
            activity.map((a) => (
              <li key={a.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  {a.createdAt.slice(0, 16).replace("T", " ")} · {a.alertType}
                </span>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>{a.body}</p>
              </li>
            ))
          )}
        </ul>
      )}

      {panel === "invite" && (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}>
          <label style={{ fontSize: "0.85rem" }}>
            Channel
            <select
              className="w-full rounded-lg border px-3 py-2 mt-1 text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value as "email" | "sms")}
            >
              <option value="email">Email</option>
              <option value="sms">SMS (copy link manually)</option>
            </select>
          </label>
          <label style={{ fontSize: "0.85rem" }}>
            {channel === "email" ? "Client email" : "Client phone"}
            <input
              className="w-full rounded-lg border px-3 py-2 mt-1 text-sm"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </label>
          <button type="button" className="app-btn app-btn--primary" disabled={busy} onClick={() => void sendInvite()}>
            Send invitation
          </button>
          {status && <p className="text-sm text-primary">{status}</p>}
          <p className="text-xs text-muted-foreground break-all">Link: {portalUrl}</p>
          <button
            type="button"
            className="app-btn app-btn--secondary"
            onClick={() => void navigator.clipboard.writeText(portalUrl)}
          >
            Copy Client Vault link
          </button>
        </div>
      )}

      {panel === "messages" && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p className="text-sm text-muted-foreground">
            Two-way messaging with your client — same thread they see in Client Vault.
          </p>
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 280, overflow: "auto" }}>
            {messages.map((m) => (
              <li
                key={m.id}
                style={{
                  padding: "0.5rem",
                  marginBottom: 6,
                  borderRadius: 8,
                  background: m.direction === "inbound" ? "#eff6ff" : "#f8fafc",
                  fontSize: "0.85rem",
                }}
              >
                <strong>{m.direction === "inbound" ? "Client" : "Staff"}</strong> ·{" "}
                {m.createdAt.slice(0, 16).replace("T", " ")}
                <p style={{ margin: "0.25rem 0 0" }}>{m.body}</p>
              </li>
            ))}
          </ul>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm min-h-[72px]"
            placeholder="Reply to client…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button type="button" className="app-btn app-btn--primary" disabled={busy} onClick={() => void sendReply()}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function NotesTimelineTab({ matterId }: { matterId: string }) {
  const [notes, setNotes] = useState<MatterNote[]>([]);

  useEffect(() => {
    void fetchMatterDossier(matterId).then((d) => setNotes(d.dossier.notes));
  }, [matterId]);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Same timeline as Field capture — notes, uploads, and system events on file.
      </p>
      <Link href={`/field-capture?matter=${matterId}`} className="app-btn app-btn--tonal mb-4 inline-flex">
        Record note or call (Field capture)
      </Link>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {notes.map((n) => (
          <li key={n.id} style={{ padding: "0.65rem 0", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
              {n.createdAt.slice(0, 16).replace("T", " ")} · {n.authorLabel}
              {n.source === "voice" && " · voice"}
            </span>
            <p style={{ margin: "0.25rem 0 0" }}>{n.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MatterWorkspace({ matterId, debtorName }: { matterId: string; debtorName: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "command");
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const setTab = (tab: TabId) => {
    setActiveTab(tab);
    router.replace(`/matters/${matterId}?tab=${tab}`, { scroll: false });
  };

  const forgeSync = async () => {
    setSyncing(true);
    try {
      const r = await applyForgeSync(matterId);
      if (r.ok) setSyncMsg(r.message);
      else
        setSyncMsg(
          `Document may belong to ${r.mismatch.bestMatch?.debtorDisplayName ?? "another client"} — check dossier`
        );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="matter-workspace-top-chrome">
      <div style={{ marginBottom: "0.75rem" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>{debtorName}</h1>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
          Matter {matterId} · Bankruptcy
        </p>
      </div>

      <div className="app-matter-tab-toolbar">
        <div className="app-chrome-matter-action-bar">
          <button type="button" className="app-btn app-btn--secondary" onClick={() => setRecordingOpen((o) => !o)}>
            {recordingOpen ? "Hide record call" : "Record phone call"}
          </button>
          <button type="button" className="app-btn app-btn--primary" disabled={syncing} onClick={() => void forgeSync()}>
            {syncing ? "Syncing…" : "Forge Sync"}
          </button>
          <Link href="/matters" className="app-btn app-btn--tonal">
            ← All Matters
          </Link>
        </div>
      </div>

      {syncMsg && <p className="text-sm text-primary mb-2">{syncMsg}</p>}

      {recordingOpen && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <Link href={`/field-capture?matter=${matterId}`} className="app-btn app-btn--primary">
            Open Field capture to record
          </Link>
        </div>
      )}

      <div className="app-matter-tab-toolbar">
        <div className="app-matter-tab-scroll" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`app-matter-tab${activeTab === t.id ? " app-matter-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        {activeTab === "command" && <CommandCenter matterId={matterId} />}
        {activeTab === "intake" && <ReliefScoutPanel matterId={matterId} />}
        {activeTab === "documents" && <MatterDossierPanel matterId={matterId} />}
        {activeTab === "messages" && <PortalStaffTab matterId={matterId} />}
        {activeTab === "docReview" && <DocumentReviewPanel matterId={matterId} />}
        {activeTab === "finalCheck" && <FinalCheckPanel matterId={matterId} />}
        {activeTab === "calendar" && <MatterCalendarPanel matterId={matterId} />}
        {activeTab === "forge" && (
          <p>
            <Link href={`/matters/${matterId}/forge`} className="app-btn app-btn--primary">
              Open {BRAND.forge.name} →
            </Link>
          </p>
        )}
        {activeTab === "filing" && <FilingPacketPanel matterId={matterId} />}
        {activeTab === "financials" && (
          <p>
            <Link href={`/matters/${matterId}/billing`} className="app-btn app-btn--primary">
              Open {BRAND.trustLedger.name} →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
