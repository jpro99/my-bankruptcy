"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, X } from "lucide-react";
import { askReliefCopilot, type CopilotPhase } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const QUICK_PROMPTS = [
  "What should I do next?",
  "Any fields left to approve?",
  "Am I ready to file?",
  "What happens after discharge?",
] as const;

interface CopilotMessage {
  role: "user" | "assistant";
  text: string;
  suggestedAction?: { label: string; href: string };
}

export function ReliefCopilotSheet({
  matterId,
  phase,
}: {
  matterId: string;
  phase: CopilotPhase;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setQuestion("");
      setLoading(true);

      try {
        const res = await askReliefCopilot(matterId, { question: trimmed, phase });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: res.answer,
            suggestedAction: res.suggestedAction,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Could not reach co-pilot — check API is running with DEV_AUTH_BYPASS=1.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, matterId, phase]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 left-6 z-50 flex size-14 items-center justify-center rounded-full shadow-glow transition md:size-16",
          open ? "bg-muted text-foreground" : "bg-primary text-white"
        )}
        aria-label={BRAND.copilot.name}
      >
        <Bot className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:inset-x-auto md:bottom-24 md:left-6 md:w-[28rem]">
          <Card className="border-primary/30 shadow-elevated max-h-[70vh] flex flex-col">
            <CardContent className="flex flex-col gap-3 p-4 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <p className="text-sm font-bold">{BRAND.copilot.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{phase} phase</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1 hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] max-h-[240px]">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground">{BRAND.copilot.description}</p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      m.role === "user" ? "bg-primary/10 ml-6" : "bg-muted mr-2"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.suggestedAction && (
                      <Link
                        href={m.suggestedAction.href}
                        className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        → {m.suggestedAction.label}
                      </Link>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Thinking…
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 shrink-0">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="rounded-full border px-2 py-0.5 text-[10px] hover:bg-muted"
                    onClick={() => void ask(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 shrink-0">
                <input
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="Ask about this matter…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(question);
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={!question.trim() || loading}
                  onClick={() => void ask(question)}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
