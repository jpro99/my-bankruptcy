/** Audio transcription + summary for field capture recordings (bankruptcy matters) */

const MAX_TRANSCRIPT_STORE = 45_000;

function clampTranscript(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_TRANSCRIPT_STORE) return t;
  return `${t.slice(0, MAX_TRANSCRIPT_STORE)}\n\n…(transcript truncated)`;
}

export async function transcribeRecordingAudio(
  buf: Buffer,
  mimeType: string
): Promise<{ text: string; engine: string }> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) {
    throw new Error(
      "Add OPENAI_API_KEY on the API server for Whisper transcription (recommended)."
    );
  }

  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "audio";
  const form = new FormData();
  form.append("file", new Blob([buf], { type: mimeType }), `recording.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "en");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Transcription failed (${res.status})`);
  }

  const text = (data.text ?? "").trim();
  if (!text) {
    throw new Error("Transcription was empty — check microphone input or length.");
  }

  return { text, engine: "whisper" };
}

export function summarizeRecordingTranscript(transcript: string): {
  title: string;
  synopsis: string;
  noteBody: string;
} {
  const t = transcript.trim();
  const title = inferTitle(t);
  const synopsis = t.length > 500 ? `${t.slice(0, 497)}…` : t;
  const noteBody = [
    title,
    "",
    synopsis,
    "",
    "— Transcript —",
    clampTranscript(t),
  ].join("\n");

  return { title, synopsis, noteBody };
}

function inferTitle(transcript: string): string {
  const lower = transcript.toLowerCase();
  if (lower.includes("341") || lower.includes("meeting of creditors")) {
    return "341 / creditors meeting call";
  }
  if (lower.includes("consult") || lower.includes("intake")) {
    return "Bankruptcy consult recording";
  }
  if (lower.includes("document") || lower.includes("pay stub") || lower.includes("paystub")) {
    return "Document intake call";
  }
  if (lower.includes("fee") || lower.includes("retainer")) {
    return "Fee / retainer discussion";
  }
  return "Call / meeting recording";
}

export function buildRecordingNoteText(input: {
  title: string;
  synopsis: string;
  transcript: string;
  engine: string;
}): string {
  return [
    `**${input.title}**`,
    "",
    input.synopsis,
    "",
    `_Transcribed via ${input.engine} · AI-assisted — review for accuracy._`,
    "",
    "--- Transcript ---",
    clampTranscript(input.transcript),
  ].join("\n");
}
