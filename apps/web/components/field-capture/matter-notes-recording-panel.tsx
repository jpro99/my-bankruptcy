"use client";

import React, { useEffect, useRef, useState } from "react";
import { uploadMatterRecording } from "@/lib/api-client";

type Props = {
  matterId: string;
  onComplete: () => void;
};

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MatterNotesRecordingPanel({ matterId, onComplete }: Props) {
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeRef = useRef<string>("audio/webm");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setErr(null);
    setOkMsg(null);
    if (!consent) {
      setErr("Confirm recording consent below before starting.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErr("This browser does not support microphone recording here.");
      return;
    }
    const mime = pickMimeType();
    if (!mime || typeof MediaRecorder === "undefined") {
      setErr("Recording is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      mimeRef.current = mime;

      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(1000);
      setState("recording");
      setElapsed(0);
      stopTimer();
      timerRef.current = setInterval(() => {
        setElapsed((x) => x + 1);
      }, 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not access microphone.";
      setErr(`${msg} Allow mic access for this site, or check browser permissions.`);
    }
  };

  const stopRecording = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    stopTimer();
    setState("processing");
    setErr(null);

    await new Promise<void>((resolve) => {
      mr.addEventListener("stop", () => resolve(), { once: true });
      try {
        mr.stop();
      } catch {
        resolve();
      }
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;

    const blob = new Blob(chunksRef.current, { type: mimeRef.current });
    chunksRef.current = [];

    const maxBytes = 18 * 1024 * 1024;
    if (blob.size > maxBytes) {
      setErr(
        `Recording is too large (${Math.round(blob.size / (1024 * 1024))} MB). Use a shorter recording.`
      );
      setState("idle");
      return;
    }

    if (blob.size < 500) {
      setErr("Recording is too short — nothing was captured.");
      setState("idle");
      return;
    }

    const fd = new FormData();
    fd.append("audio", blob, "recording.webm");
    fd.append("mimeType", mimeRef.current);
    fd.append("at", new Date().toISOString());

    try {
      const data = await uploadMatterRecording(matterId, fd);
      setOkMsg(`Saved: ${data.title ?? "Recording"}`);
      onComplete();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload or processing failed.");
    } finally {
      setState("idle");
      setElapsed(0);
    }
  };

  const supported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(pickMimeType());

  return (
    <section
      style={{
        border: "1px solid #fed7aa",
        borderRadius: 10,
        padding: "0.9rem 1rem",
        background: "#fffbeb",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.35rem",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#9a3412",
        }}
      >
        Record bankruptcy consult or client call
      </h3>
      <p
        style={{
          margin: "0 0 0.55rem",
          fontSize: "0.76rem",
          color: "#78350f",
          lineHeight: 1.45,
        }}
      >
        Uses this <strong>device microphone</strong>. For a phone call, use speakerphone or a
        headset so the mic can hear both sides. After you stop, we transcribe the audio and add a
        Bench Note with a <strong>summary</strong> and <strong>transcript</strong> (AI-assisted —
        review for accuracy).{" "}
        <strong>Record only where the law and your firm allow.</strong>
      </p>
      {!supported ? (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#b45309" }}>
          Recording is not available in this browser or context (try Chrome / Edge on HTTPS).
        </p>
      ) : (
        <>
          <label
            style={{
              display: "flex",
              gap: "0.45rem",
              alignItems: "flex-start",
              fontSize: "0.78rem",
              color: "#422006",
              marginBottom: "0.55rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setErr(null);
              }}
            />
            <span>
              I confirm this recording is permitted under applicable law and our firm&apos;s policy
              (including consent rules where required).
            </span>
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            {state === "recording" ? (
              <>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#b91c1c",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#ef4444",
                      animation: "fc-pulse 1.2s ease-in-out infinite",
                    }}
                  />
                  Recording {formatElapsed(elapsed)}
                </span>
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  style={{
                    fontSize: "0.82rem",
                    background: "#b91c1c",
                    borderColor: "#991b1b",
                  }}
                  onClick={() => void stopRecording()}
                >
                  Stop &amp; save to timeline
                </button>
              </>
            ) : (
              <button
                type="button"
                className="app-btn app-btn--secondary"
                disabled={state === "processing" || !consent}
                style={{ fontSize: "0.82rem" }}
                onClick={() => void startRecording()}
              >
                {state === "processing" ? "Transcribing…" : "Start recording"}
              </button>
            )}
          </div>
          <style>{`
            @keyframes fc-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.92); }
            }
          `}</style>
          <p
            style={{
              margin: "0.45rem 0 0",
              fontSize: "0.7rem",
              color: "#92400e",
            }}
          >
            Requires <code style={{ fontSize: "0.68rem" }}>OPENAI_API_KEY</code> on the API server
            (Whisper).
          </p>
        </>
      )}
      {err ? (
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.8rem",
            color: "#991b1b",
            whiteSpace: "pre-wrap",
          }}
        >
          {err}
        </p>
      ) : null}
      {okMsg ? (
        <p
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.8rem",
            color: "#166534",
          }}
        >
          {okMsg}
        </p>
      ) : null}
    </section>
  );
}
