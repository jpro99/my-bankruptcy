import { redactPii } from "@chapterai/ai-pipeline";

export type CopilotPhase = "scout" | "forge" | "gavel" | "continuum";

export interface CopilotContext {
  matterId: string;
  phase: CopilotPhase;
  chapter: "7" | "13";
  debtorLabel: string;
  nextActionLabel?: string;
  nextActionHref?: string;
  filed: boolean;
  pendingFieldCount: number;
  overallPercent: number;
  preflightReady: boolean;
}

export interface CopilotResult {
  answer: string;
  suggestedAction?: { label: string; href: string };
  demoMode: boolean;
  piiRedacted: boolean;
}

function demoAnswer(ctx: CopilotContext, topic: string): CopilotResult {
  const ch = ctx.chapter;
  const base = `/matters/${ctx.matterId}`;

  const phaseIntro: Record<CopilotPhase, string> = {
    scout: `You're in **Relief Scout** for a Chapter ${ch} matter (${ctx.overallPercent}% complete). Run the quick means test, record take/pass/maybe, then enter The Forge.`,
    forge: `You're in **The Forge** — pre-filing work for Chapter ${ch}. Approve AI-extracted fields, pull credit, confirm schedules, then Seal Check before The Gavel.`,
    gavel: `You're at **The Gavel** — Seal Check passed or pending. Strike The Gavel when preflight is green; sandbox filing unlocks Continuum.`,
    continuum: ctx.filed
      ? `You're on **Continuum** — post-filing through discharge. Track 341, §521 docs, Course 2, and discharge eligibility.`
      : `Continuum unlocks after filing. Finish Forge + Gavel first.`,
  };

  let answer = phaseIntro[ctx.phase];
  const lower = topic.toLowerCase();

  if (lower.includes("next") || lower.includes("what should")) {
    if (ctx.nextActionLabel && ctx.nextActionHref) {
      answer = `${answer}\n\n**Next:** ${ctx.nextActionLabel}`;
      return {
        answer,
        suggestedAction: { label: ctx.nextActionLabel, href: ctx.nextActionHref },
        demoMode: true,
        piiRedacted: false,
      };
    }
  }

  if (lower.includes("field") && ctx.pendingFieldCount > 0) {
    answer = `${answer}\n\n${ctx.pendingFieldCount} petition fields still need approve/edit in The Forge. Bulk-approve items above 95% confidence.`;
  }

  if (lower.includes("discharge") && ctx.filed) {
    answer = `${answer}\n\nDischarge track: confirm no §727 objections, Course 2 complete, and 341 held. Use Continuum autopilot tasks.`;
  }

  if (lower.includes("file") || lower.includes("gavel")) {
    answer = ctx.preflightReady
      ? `${answer}\n\nPreflight is green — ready to Strike The Gavel from the filing packet section.`
      : `${answer}\n\nPreflight not clear yet — resolve pending fields and district rules first.`;
  }

  if (ctx.phase === "scout" && (lower.includes("means") || lower.includes("chapter"))) {
    answer = `${answer}\n\nScout runs Forms 122A/C against CA median income. Below median → Ch 7 likely. Above → 122A-2 or Ch 13.`;
  }

  const fallbackHref =
    ctx.nextActionHref ??
    (ctx.phase === "continuum" ? `${base}/continuum` : `${base}/forge`);

  return {
    answer,
    suggestedAction: ctx.nextActionLabel
      ? { label: ctx.nextActionLabel, href: fallbackHref }
      : undefined,
    demoMode: true,
    piiRedacted: false,
  };
}

/** Attorney co-pilot — PII-safe; demo answers when no API key */
export function runCopilot(question: string, ctx: CopilotContext): CopilotResult {
  const { redactedText, redactionCount } = redactPii(question.trim());
  const piiRedacted = redactionCount > 0;

  if (!redactedText) {
    return {
      answer: "Ask a question about this matter — next steps, fields, filing, or discharge.",
      demoMode: true,
      piiRedacted,
    };
  }

  // Phase 1: demo-mode only — real LLM wired when ANTHROPIC_API_KEY present (future)
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoAnswer(ctx, redactedText);
  }

  // Placeholder for live model — still never log raw question
  return demoAnswer(ctx, redactedText);
}
