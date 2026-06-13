"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send } from "lucide-react";
import { addMatterNoteApi } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
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

export function BenchNotesSheet({ matterId }: { matterId: string }) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let text = "";
      const results = event.results as unknown as Array<{ [j: number]: { transcript: string } }>;
      for (let i = 0; i < results.length; i++) {
        text += results[i]![0]!.transcript;
      }
      setTranscript(text.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setOpen(true);
  }, []);

  const saveNote = async () => {
    const text = transcript.trim();
    if (!text) return;
    setSaving(true);
    try {
      await addMatterNoteApi(matterId, text, listening ? "voice" : "attorney");
      setTranscript("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      if (listening) stopListening();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMic = () => {
    if (listening) {
      stopListening();
      void saveNote();
    } else {
      setTranscript("");
      startListening();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-glow transition md:size-16",
          open ? "bg-muted text-foreground" : "bg-primary text-white"
        )}
        aria-label={BRAND.benchNotes.name}
      >
        <Mic className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:inset-x-auto md:bottom-24 md:right-6 md:w-96">
          <Card className="border-primary/30 shadow-elevated">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{BRAND.benchNotes.name}</p>
                {savedFlash && (
                  <span className="text-xs font-medium text-emerald-600">Saved to file</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{BRAND.benchNotes.description}</p>

              <textarea
                className="min-h-[88px] w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Type or tap the mic — say what to put in this person's file…"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />

              <div className="flex gap-2">
                {speechSupported && (
                  <Button
                    type="button"
                    variant={listening ? "danger" : "secondary"}
                    className="flex-1"
                    onClick={handleToggleMic}
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
                  type="button"
                  className="flex-1"
                  disabled={!transcript.trim() || saving}
                  onClick={() => void saveNote()}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
                  Save note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
