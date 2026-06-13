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
      id: "intake",
      title: "One-Touch Intake",
      description: "Drop ID, paystubs, bank statements — AI populates all schedules",
      status: stepStatus(input.intakeComplete, !input.intakeComplete, false),
      weight: 15,
      actionLabel: "Upload documents",
      actionHref: `${base}/intake`,
      estimatedMinutes: 5,
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
      actionLabel: "Pull credit",
      actionHref: `${base}/cockpit`,
      estimatedMinutes: 2,
    },
    {
      id: "review",
      title: "Approve-Only Review",
      description: "Swipe through AI fields — Approve, Edit, or Question",
      status: stepStatus(
        input.reviewComplete,
        input.pendingFieldCount > 0 && input.pendingFieldCount < 20,
        false
      ),
      weight: 25,
      actionLabel: input.pendingFieldCount > 0 ? `${input.pendingFieldCount} fields left` : "Review queue",
      actionHref: `${base}/cockpit`,
      estimatedMinutes: Math.max(5, input.pendingFieldCount * 2),
    },
    {
      id: "schedules",
      title: "Petition Schedules",
      description: "Full A/B–J read-only view — property, creditors, income, exemptions",
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
      title: "Fees & Trust",
      description: "Flat fee quote, court costs, client payment tracking",
      status: stepStatus(
        parseFloat(input.balanceDue) === 0,
        parseFloat(input.balanceDue) > 0,
        false
      ),
      weight: 5,
      actionLabel: "View billing",
      actionHref: `${base}/billing`,
      estimatedMinutes: 3,
    },
    {
      id: "file",
      title: "God Button — E-File",
      description: "247-rule preflight → one click to CACB CM/ECF",
      status: stepStatus(
        input.filed,
        input.preflightReady && !input.filed,
        !input.preflightReady && !input.filed
      ),
      weight: 20,
      actionLabel: input.filed ? "Filed ✓" : "File now",
      actionHref: `${base}/cockpit`,
      estimatedMinutes: 2,
    },
    {
      id: "portal",
      title: "Client Portal",
      description: "Debtor uploads paystubs, tax returns — no email chasing",
      status: stepStatus(
        input.clientPortalRequestsOpen === 0 && input.filed,
        input.filed,
        !input.filed
      ),
      weight: 5,
      actionLabel: "Send portal link",
      actionHref: `/portal/${input.matterId}-client`,
      estimatedMinutes: 1,
    },
    {
      id: "autopilot",
      title: "Post-Petition Autopilot",
      description: "341 prep, §521 deadlines, discharge tracking on autopilot",
      status: stepStatus(input.autopilotActive, input.filed && !input.autopilotActive, !input.filed),
      weight: 10,
      actionLabel: "Open autopilot",
      actionHref: `${base}/autopilot`,
      estimatedMinutes: 1,
    },
    {
      id: "audit",
      title: "Provenance Audit Trail",
      description: "Court-ready export — every field change with source docs + attorney approval",
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
    low: `Chapter ${ch} — ${input.debtorDisplayName}: getting started`,
    mid: `Chapter ${ch} — ${input.debtorDisplayName}: halfway there`,
    high: `Chapter ${ch} — ${input.debtorDisplayName}: almost done`,
    done: `Chapter ${ch} — ${input.debtorDisplayName}: case on autopilot 🚀`,
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
          href: next.actionHref ?? `${base}/cockpit`,
          label: next.actionLabel ?? "Continue",
        }
      : undefined,
    readyToFile: input.preflightReady && !input.filed,
    tagline,
  };
}
