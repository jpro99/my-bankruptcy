import type { ComputeProgressInput, GuideStep, MatterProgress } from "./types.js";

function stepStatus(
  complete: boolean,
  inProgress: boolean,
  blocked: boolean
): GuideStep["status"] {
  if (complete) return "complete";
  if (blocked) return "blocked";
  if (inProgress) return "in_progress";
  return "pending";
}

/** One-screen attorney completion pipeline — Ch 7 or Ch 13 */
export function computeMatterProgress(input: ComputeProgressInput): MatterProgress {
  const base = `/matters/${input.matterId}`;
  const ch = input.chapter;

  const steps: GuideStep[] = [
    {
      id: "scout",
      title: "Relief Scout",
      description: "Quick means test — take the case, pass, or maybe — notes on file",
      status: stepStatus(
        input.consultComplete ?? false,
        !(input.consultComplete ?? false),
        false
      ),
      weight: 5,
      actionLabel: input.consultComplete ? "Scout complete" : "Run Relief Scout",
      actionHref: `${base}/scout`,
      estimatedMinutes: 3,
    },
    {
      id: "intake",
      title: "Document Drop",
      description: "Client Vault + attorney uploads — Forge Sync fills the petition",
      status: stepStatus(
        input.intakeComplete,
        (input.pendingIntakeCount ?? 0) > 0 || !input.intakeComplete,
        !(input.consultComplete ?? false)
      ),
      weight: 15,
      actionLabel:
        (input.pendingIntakeCount ?? 0) > 0
          ? `${input.pendingIntakeCount} ready to sync`
          : "Upload documents",
      actionHref: `${base}/intake`,
      estimatedMinutes: 5,
    },
    {
      id: "counseling",
      title: "Counseling Bridge",
      description: "Course 1 before filing — secure link to AOUST provider",
      status: stepStatus(
        input.counselingComplete ?? false,
        input.intakeComplete && !(input.counselingComplete ?? false),
        !input.intakeComplete
      ),
      weight: 8,
      actionLabel: input.counselingComplete ? "Course 1 complete" : "Send client link",
      actionHref: `${base}/command`,
      estimatedMinutes: 2,
    },
    {
      id: "credit",
      title: "Tri-Merge Credit",
      description: "Auto-classify creditors to Schedules D, E, F, G",
      status: stepStatus(
        input.creditPulled,
        input.reviewComplete && !input.creditPulled,
        !input.intakeComplete
      ),
      weight: 10,
      actionLabel: input.creditPulled ? "Review credit" : "Pull credit",
      actionHref: input.creditPulled ? `${base}/credit` : `${base}/forge`,
      estimatedMinutes: 2,
    },
    {
      id: "review",
      title: "The Forge",
      description: "Approve-only review — every AI field, one decision at a time",
      status: stepStatus(
        input.reviewComplete,
        input.pendingFieldCount > 0 && input.pendingFieldCount < 20,
        false
      ),
      weight: 25,
      actionLabel: input.pendingFieldCount > 0 ? `${input.pendingFieldCount} fields left` : "Enter The Forge",
      actionHref: `${base}/forge`,
      estimatedMinutes: Math.max(5, input.pendingFieldCount * 2),
    },
    {
      id: "schedules",
      title: "Petition Schedules",
      description: "Full A/B–J view — property, creditors, income, exemptions",
      status: stepStatus(
        (input.petitionCompletionPercent ?? 0) >= 90,
        (input.petitionCompletionPercent ?? 0) >= 40,
        !input.reviewComplete
      ),
      weight: 10,
      actionLabel: "View schedules",
      actionHref: `${base}/schedules`,
      estimatedMinutes: 5,
    },
    {
      id: "district",
      title: "Filing District",
      description: input.districtConfigured
        ? "California district + division confirmed"
        : "Select county — auto-routes to CACB, CAEB, CANB, or CASB",
      status: stepStatus(!!input.districtConfigured, !input.districtConfigured, false),
      weight: 5,
      actionLabel: "Confirm district",
      actionHref: `${base}/schedules`,
      estimatedMinutes: 1,
    },
    ...(ch === "13"
      ? [
          {
            id: "plan",
            title: "Chapter 13 Plan",
            description: "CACB 3015-1.01 calculator + best interest test",
            status: stepStatus(input.reviewComplete, input.reviewComplete, !input.reviewComplete),
            weight: 15,
            actionLabel: "Build plan",
            actionHref: `${base}/plan`,
            estimatedMinutes: 15,
          } satisfies GuideStep,
        ]
      : []),
    {
      id: "billing",
      title: "Trust Ledger",
      description: "Flat fee, trust accounting, instant printable receipts",
      status: stepStatus(
        parseFloat(input.balanceDue) === 0,
        parseFloat(input.balanceDue) > 0,
        false
      ),
      weight: 5,
      actionLabel: "View ledger",
      actionHref: `${base}/billing`,
      estimatedMinutes: 3,
    },
    {
      id: "file",
      title: "The Gavel",
      description: "Seal Check → one motion to CACB CM/ECF",
      status: stepStatus(
        input.filed,
        input.preflightReady && !input.filed,
        !input.preflightReady && !input.filed
      ),
      weight: 20,
      actionLabel: input.filed ? "Filed ✓" : "Strike The Gavel",
      actionHref: `${base}/forge`,
      estimatedMinutes: 2,
    },
    {
      id: "portal",
      title: "Client Vault",
      description: "Encrypted magic link — documents & required courses",
      status: stepStatus(
        input.clientPortalRequestsOpen === 0 && input.filed,
        input.filed,
        !input.filed
      ),
      weight: 5,
      actionLabel: "Copy secure link",
      actionHref: `${base}/command`,
      estimatedMinutes: 1,
    },
    {
      id: "continuum",
      title: "Continuum",
      description: "341 through discharge — post-fetition path, nothing missed",
      status: stepStatus(input.autopilotActive, input.filed && !input.autopilotActive, !input.filed),
      weight: 10,
      actionLabel: "Open Continuum",
      actionHref: `${base}/continuum`,
      estimatedMinutes: 1,
    },
    {
      id: "discharge-follow-up",
      title: "Discharge + PI follow-up",
      description: "Congratulate client on discharge — mention personal injury if interested",
      status: stepStatus(
        !!input.dischargeFollowUpSent,
        input.filed && !input.dischargeFollowUpSent,
        !input.filed
      ),
      weight: 5,
      actionLabel: input.dischargeFollowUpSent ? "Sent ✓" : "Send follow-up",
      actionHref: `${base}/continuum`,
      estimatedMinutes: 2,
    },
    {
      id: "filing-packet",
      title: "Filing packet",
      description: "Full CM/ECF bundle — petition, schedules, locals, matrix",
      status: stepStatus(
        input.preflightReady || input.filed,
        !input.preflightReady && !input.filed,
        false
      ),
      weight: 5,
      actionLabel: "View packet",
      actionHref: `${base}/filing-packet`,
      estimatedMinutes: 2,
    },
    {
      id: "audit",
      title: "Provenance Audit Trail",
      description: "Court-ready export — every field change with source docs",
      status: stepStatus(input.reviewComplete, input.pendingFieldCount > 0, false),
      weight: 5,
      actionLabel: "Export audit",
      actionHref: `${base}/audit`,
      estimatedMinutes: 2,
    },
  ];

  const totalWeight = steps.reduce((acc, s) => acc + s.weight, 0);
  const earnedWeight = steps.reduce((acc, s) => {
    if (s.status === "complete") return acc + s.weight;
    if (s.status === "in_progress") return acc + s.weight * 0.5;
    return acc;
  }, 0);

  const overallPercent = Math.round((earnedWeight / totalWeight) * 100);
  const stepsComplete = steps.filter((s) => s.status === "complete").length;

  const next = steps.find((s) => s.status === "in_progress" || s.status === "pending");

  const taglines: Record<string, string> = {
    low: `Chapter ${ch} — ${input.debtorDisplayName}: forging your petition`,
    mid: `Chapter ${ch} — ${input.debtorDisplayName}: halfway to relief`,
    high: `Chapter ${ch} — ${input.debtorDisplayName}: ready for The Gavel`,
    done: `Chapter ${ch} — ${input.debtorDisplayName}: on the Continuum`,
  };

  let tagline = taglines.low!;
  if (overallPercent >= 100 || (input.filed && input.autopilotActive)) tagline = taglines.done!;
  else if (overallPercent >= 75) tagline = taglines.high!;
  else if (overallPercent >= 40) tagline = taglines.mid!;

  return {
    matterId: input.matterId,
    chapter: ch,
    debtorDisplayName: input.debtorDisplayName,
    overallPercent,
    stepsComplete,
    stepsTotal: steps.length,
    steps,
    nextAction: next
      ? {
          stepId: next.id,
          title: next.title,
          href: next.actionHref ?? `${base}/forge`,
          label: next.actionLabel ?? "Continue",
        }
      : undefined,
    readyToFile: input.preflightReady && !input.filed,
    tagline,
  };
}
