"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Loader2,
  Mail,
  Mic,
  MicOff,
  Send,
} from "lucide-react";
import {
  addMatterNoteApi,
  fetchCommandCenter,
  fetchMatterDossier,
  type MatterNote,
} from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import {
  BANKRUPTCY_EMAIL_TEMPLATES,
  BANKRUPTCY_EVENT_TEMPLATES,
  buildGmailComposeUrl,
  buildGoogleCalendarUrl,
  downloadIcsFile,
  type BankruptcyEmailKind,
  type BankruptcyEventKind,
} from "@/lib/mobile-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: unknown }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function defaultEventStart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function MobileMatterActions({ matterId }: { matterId: string }) {
  const [debtorName, setDebtorName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [notes, setNotes] = useState<MatterNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [noteText, setNoteText] = useState("");
  const [listening, setListening] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const [eventKind, setEventKind] = useState<BankruptcyEventKind>("follow_up");
  const [eventStart, setEventStart] = useState(defaultEventStart);

  const [emailKind, setEmailKind] = useState<BankruptcyEmailKind>("documents_request");
  const [clientEmail, setClientEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cmd, dossier] = await Promise.all([
        fetchCommandCenter(matterId),
        fetchMatterDossier(matterId),
      ]);
      setDebtorName(cmd.progress.debtorDisplayName);
      setPortalUrl(cmd.portalUrl);
      setNotes(dossier.dossier.notes.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveNote = async (fromVoice = false) => {
    const text = noteText.trim();
    if (!text) return;
    setSavingNote(true);
    try {
      await addMatterNoteApi(matterId, text, fromVoice ? "voice" : "attorney");
      setNoteText("");
      await load();
    } finally {
      setSavingNote(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      void saveNote(true);
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let text = "";
      const results = event.results as Array<{ [j: number]: { transcript: string } }>;
      for (let i = 0; i < results.length; i++) {
        text += results[i]![0]!.transcript;
      }
      setNoteText(text.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const openGoogleCalendar = () => {
    const tpl = BANKRUPTCY_EVENT_TEMPLATES[eventKind];
    const start = new Date(eventStart);
    const url = buildGoogleCalendarUrl({
      title: tpl.defaultTitle(debtorName || "Client"),
      start,
      durationMin: tpl.defaultDurationMin,
      details: tpl.defaultDetails(debtorName, matterId),
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openGmail = () => {
    const tpl = BANKRUPTCY_EMAIL_TEMPLATES[emailKind];
    const extra = emailKind === "portal_link" ? portalUrl : undefined;
    const url = buildGmailComposeUrl({
      to: clientEmail || undefined,
      subject: tpl.subject(debtorName || "Client"),
      body: tpl.body(debtorName, matterId, extra),
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const addIcs = () => {
    const tpl = BANKRUPTCY_EVENT_TEMPLATES[eventKind];
    downloadIcsFile({
      title: tpl.defaultTitle(debtorName || "Client"),
      start: new Date(eventStart),
      durationMin: tpl.defaultDurationMin,
      details: tpl.defaultDetails(debtorName, matterId),
      uid: `${matterId}-${eventKind}@my-bankruptcy.app`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="shrink-0 px-2">
          <Link href="/mobile">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Bankruptcy matter
          </p>
          <h1 className="truncate font-display text-xl font-bold">{debtorName}</h1>
        </div>
      </div>

      {/* Bench Notes */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Mic className="size-3.5" />
          {BRAND.benchNotes.name}
        </h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            <textarea
              className="min-h-[88px] w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="Leave a note in this file…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex gap-2">
              {getSpeechRecognition() && (
                <Button
                  type="button"
                  variant={listening ? "danger" : "secondary"}
                  className="flex-1"
                  onClick={toggleVoice}
                >
                  {listening ? (
                    <>
                      <MicOff className="size-4" />
                      Stop & save
                    </>
                  ) : (
                    <>
                      <Mic className="size-4" />
                      Dictate
                    </>
                  )}
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={!noteText.trim() || savingNote}
                onClick={() => void saveNote()}
              >
                {savingNote ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
                Save to file
              </Button>
            </div>
          </CardContent>
        </Card>
        {notes.length > 0 && (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-dashed px-3 py-2 text-xs">
                <p>{n.text}</p>
                <p className="mt-1 text-muted-foreground">
                  {n.createdAt.slice(0, 16).replace("T", " ")}
                  {n.source === "voice" && " · voice"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Google Calendar — bankruptcy events */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Calendar className="size-3.5" />
          Google Calendar
        </h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Event type</span>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
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
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Date & time</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                value={eventStart}
                onChange={(e) => setEventStart(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={openGoogleCalendar}>
                <CalendarPlus className="size-4" />
                Google Calendar
              </Button>
              <Button variant="secondary" onClick={addIcs}>
                <Calendar className="size-4" />
                Download .ics
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Opens Gmail Calendar with bankruptcy-specific title & notes — 341, consult, docs due,
              filing target, etc.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Gmail — bankruptcy templates */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Mail className="size-3.5" />
          Gmail
        </h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Email template</span>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                value={emailKind}
                onChange={(e) => setEmailKind(e.target.value as BankruptcyEmailKind)}
              >
                {Object.entries(BANKRUPTCY_EMAIL_TEMPLATES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Client email (optional)</span>
              <input
                type="email"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                placeholder="client@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </label>
            <Button className="w-full" onClick={openGmail}>
              <Mail className="size-4" />
              Open in Gmail
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Ch matter</Badge>
        <Badge variant="secondary">{matterId}</Badge>
      </div>

      <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
        <Link href={`/matters/${matterId}/command`}>Open full {BRAND.command.name} →</Link>
      </Button>
    </div>
  );
}
