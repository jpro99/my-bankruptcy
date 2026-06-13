"use client";

import { useState } from "react";
import {
  BANKRUPTCY_EVENT_TEMPLATES,
  buildGoogleCalendarUrl,
  downloadIcsFile,
  type BankruptcyEventKind,
} from "@/lib/mobile-calendar";

type Props = {
  matterId: string;
  matterLabel: string;
  onBack: () => void;
};

export function BankruptcyCalendarPanel({ matterId, matterLabel, onBack }: Props) {
  const [eventKind, setEventKind] = useState<BankruptcyEventKind>("consult");
  const [eventStart, setEventStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [location, setLocation] = useState("");

  const tpl = BANKRUPTCY_EVENT_TEMPLATES[eventKind];
  const start = new Date(eventStart);

  const openGoogle = () => {
    const url = buildGoogleCalendarUrl({
      title: tpl.defaultTitle(matterLabel),
      start,
      durationMin: tpl.defaultDurationMin,
      details: tpl.defaultDetails(matterLabel, matterId),
      location: location.trim() || undefined,
    });
    window.open(url, "_blank");
  };

  return (
    <section className="field-capture-card">
      <button type="button" className="field-capture-back" onClick={onBack}>
        ← Back
      </button>

      <h2 className="field-capture-section-title">Add to Google Calendar</h2>
      <p className="field-capture-hint">
        Schedule bankruptcy milestones — consults, document deadlines, 341 meetings, filing targets,
        and fee reminders. Opens Google Calendar with the details pre-filled.
      </p>

      <label className="field-capture-label">
        Event type
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
      </label>

      <label className="field-capture-label">
        Date &amp; time
        <input
          type="datetime-local"
          className="field-capture-input"
          value={eventStart}
          onChange={(e) => setEventStart(e.target.value)}
        />
      </label>

      <label className="field-capture-label">
        Location (optional)
        <input
          className="field-capture-input"
          placeholder="Office, courthouse, Zoom link…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>

      <div className="field-capture-portal-actions">
        <button
          type="button"
          className="field-capture-small-btn field-capture-small-btn--primary"
          onClick={openGoogle}
        >
          Open Google Calendar
        </button>
        <button
          type="button"
          className="field-capture-small-btn"
          onClick={() =>
            downloadIcsFile({
              title: tpl.defaultTitle(matterLabel),
              start,
              durationMin: tpl.defaultDurationMin,
              details: tpl.defaultDetails(matterLabel, matterId),
            })
          }
        >
          Download .ics file
        </button>
      </div>
    </section>
  );
}
