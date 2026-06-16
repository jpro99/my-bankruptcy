"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMatterProfile,
  fetchPortalStaff,
  sendPortalInvite,
  sendPortalStaffMessage,
  type PortalActivityEvent,
  type PortalMessage,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";

/** Client portal messaging — inside petition prep */
export function PortalStaffTab({ matterId }: { matterId: string }) {
  const [panel, setPanel] = useState<"activity" | "invite" | "messages">("messages");
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
      if (res.mailto && channel === "email") window.location.href = res.mailto;
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
        {(["messages", "invite", "activity"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`demand-preview-mode-toggle__btn${panel === p ? " demand-preview-mode-toggle__btn--active" : ""}`}
            onClick={() => setPanel(p)}
          >
            {p === "activity" ? "Activity" : p === "invite" ? "Send invite" : "Messages"}
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
              <option value="sms">SMS (copy link)</option>
            </select>
          </label>
          <label style={{ fontSize: "0.85rem" }}>
            Client email / phone
            <input
              className="w-full rounded-lg border px-3 py-2 mt-1 text-sm"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </label>
          <button type="button" className="app-btn app-btn--primary" disabled={busy} onClick={() => void sendInvite()}>
            {BRAND.clientPortal.inviteAction}
          </button>
          {status && <p className="text-sm text-primary">{status}</p>}
          <button
            type="button"
            className="app-btn app-btn--secondary"
            onClick={() => void navigator.clipboard.writeText(portalUrl)}
          >
            Copy link
          </button>
        </div>
      )}

      {panel === "messages" && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 320, overflow: "auto" }}>
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
