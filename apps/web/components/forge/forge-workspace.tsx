"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { applyForgeSync, fetchCommandCenter, type UploadMatchPreview } from "@/lib/api-client";
import { BRAND } from "@/lib/brand";
import { useTestMode } from "@/lib/test-mode";
import { ReliefCommandRail } from "@/components/command/relief-command-rail";
import { MatterDossierPanel } from "@/components/intake/matter-dossier-panel";
import { DocumentReviewPanel } from "@/components/workflow/document-review-panel";
import { FinalCheckPanel } from "@/components/workflow/final-check-panel";
import { FilingPacketPanel } from "@/components/filing/filing-packet-panel";
import { CourtPacketPreview } from "@/components/filing/court-packet-preview";
import { CreditReviewPanel } from "@/components/credit/credit-review-panel";
import { SchedulesViewer } from "@/components/schedules/schedules-viewer";
import { StaffHeader } from "@/components/staff/staff-header";
import { ReliefCopilotSheet } from "@/components/copilot/relief-copilot-sheet";
import { DocumentMatterMatchDialog } from "@/components/intake/document-matter-match-dialog";
import { PortalStaffTab } from "@/components/forge/forge-portal-messages";
import {
  CourtPacketPreviewDrawer,
} from "@/components/filing/court-packet-preview";
import { Eye } from "lucide-react";
import "@/styles/staff-chrome.css";

const FORGE_SECTIONS = [
  { id: "dossier", label: "Documents", icon: "📁", blurb: `${BRAND.clientPortal.short} uploads & apply to petition` },
  { id: "messages", label: BRAND.clientPortal.name, icon: "💬", blurb: "Portal messages & invite link" },
  { id: "credit", label: "Credit", icon: "💳", blurb: "Tri-merge → Schedules D–G" },
  { id: "schedules", label: "Schedules", icon: "📊", blurb: "A/B through J, exemptions" },
  { id: "petition", label: "Petition review", icon: "⚒️", blurb: "Approve every field" },
  { id: "court", label: "Court preview", icon: "⚖️", blurb: "Live pages — print & send to court" },
  { id: "seal", label: BRAND.sealCheck.name, icon: "👍", blurb: "Document QA + attorney sign-off" },
  { id: "file", label: "Filing packet", icon: "📦", blurb: `Court bundle → ${BRAND.gavel.action}` },
] as const;

export type ForgeSectionId = (typeof FORGE_SECTIONS)[number]["id"];

function ForgeWorkspaceInner({ matterId }: { matterId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { appHref } = useTestMode();
  const sectionParam = searchParams.get("section") as ForgeSectionId | null;
  const [section, setSection] = useState<ForgeSectionId>(
    sectionParam && FORGE_SECTIONS.some((s) => s.id === sectionParam) ? sectionParam : "dossier"
  );
  const [debtorName, setDebtorName] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncMatch, setSyncMatch] = useState<UploadMatchPreview | null>(null);
  const [courtPreviewOpen, setCourtPreviewOpen] = useState(false);

  useEffect(() => {
    void fetchCommandCenter(matterId).then((d) => setDebtorName(d.progress.debtorDisplayName));
  }, [matterId]);

  useEffect(() => {
    if (sectionParam && FORGE_SECTIONS.some((s) => s.id === sectionParam)) {
      setSection(sectionParam);
    }
  }, [sectionParam]);

  const goSection = (id: ForgeSectionId) => {
    setSection(id);
    router.replace(appHref(`/matters/${matterId}/forge?section=${id}`), { scroll: false });
  };

  const forgeSync = async (options?: { confirmMismatch?: boolean; targetMatterId?: string }) => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await applyForgeSync(matterId, options);
      if (!r.ok) {
        setSyncMatch(r.mismatch);
        return;
      }
      setSyncMatch(null);
      setSyncMsg(r.redirectedTo ? `${r.message} — matched file` : r.message);
      if (r.creditAppliedCount > 0) {
        goSection("schedules");
      }
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Apply failed — check API connection");
    } finally {
      setSyncing(false);
    }
  };

  const activeMeta = FORGE_SECTIONS.find((s) => s.id === section)!;
  const railPhase =
    section === "seal" || section === "file" ? ("gavel" as const) : ("forge" as const);

  return (
    <>
      <ReliefCommandRail matterId={matterId} activePhase={railPhase} />

      <header className="forge-workspace-header">
        <div>
          <p className="forge-workspace-header__eyebrow">{BRAND.forge.name}</p>
          <h1 className="forge-workspace-header__title">{debtorName || "Loading…"}</h1>
          <p className="forge-workspace-header__sub">{BRAND.forge.tagline}</p>
        </div>
        <div className="forge-workspace-header__actions">
          <button
            type="button"
            className="app-btn app-btn--tonal"
            onClick={() => setCourtPreviewOpen(true)}
          >
            <Eye className="size-4 inline" aria-hidden />
            Court preview
          </button>
          <Link href={`/matters/${matterId}/practice`} className="app-btn app-btn--tonal">
            {BRAND.practiceMode.short} filing
          </Link>
          <button
            type="button"
            className="app-btn app-btn--primary"
            disabled={syncing}
            onClick={() => void forgeSync()}
          >
            {syncing ? "Syncing…" : BRAND.forgeSync.action}
          </button>
          <Link href={`/matters/${matterId}/scout`} className="app-btn app-btn--tonal">
            {BRAND.reliefScout.short}
          </Link>
        </div>
      </header>

      {syncMsg && <p className="text-sm text-primary mb-2">{syncMsg}</p>}

      <div className="forge-workspace-layout">
        <nav className="forge-section-nav" aria-label="Petition prep sections">
          {FORGE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`forge-section-nav__item${section === s.id ? " forge-section-nav__item--active" : ""}`}
              onClick={() => goSection(s.id)}
            >
              <span className="forge-section-nav__icon">{s.icon}</span>
              <span className="forge-section-nav__text">
                <span className="forge-section-nav__label">{s.label}</span>
                <span className="forge-section-nav__blurb">{s.blurb}</span>
              </span>
            </button>
          ))}
          <Link
            href={`/matters/${matterId}/billing`}
            className="forge-section-nav__item forge-section-nav__item--link"
          >
            <span className="forge-section-nav__icon">💰</span>
            <span className="forge-section-nav__text">
              <span className="forge-section-nav__label">{BRAND.trustLedger.name}</span>
            </span>
          </Link>
        </nav>

        <div className="forge-section-panel">
          <p className="forge-section-panel__meta">
            {section === "dossier" && debtorName
              ? `${debtorName}'s file — ${activeMeta.blurb}`
              : `${activeMeta.icon} ${activeMeta.label} — ${activeMeta.blurb}`}
          </p>

          {section === "dossier" && (
            <div className="space-y-8">
              <MatterDossierPanel
                matterId={matterId}
                onSyncComplete={(result) => {
                  if (result && result.creditAppliedCount > 0) goSection("schedules");
                }}
              />
              <DocumentReviewPanel matterId={matterId} />
            </div>
          )}
          {section === "messages" && <PortalStaffTab matterId={matterId} />}
          {section === "credit" && <CreditReviewPanel matterId={matterId} />}
          {section === "schedules" && <SchedulesViewer matterId={matterId} />}
          {section === "petition" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Card-by-card field approval — AI proposes; you approve, edit, or question every value.
              </p>
              <Link href={`/matters/${matterId}/forge/review`} className="app-btn app-btn--primary">
                Open petition review →
              </Link>
            </div>
          )}
          {section === "court" && <CourtPacketPreview matterId={matterId} layout="inline" />}
          {section === "seal" && <FinalCheckPanel matterId={matterId} />}
          {section === "file" && <FilingPacketPanel matterId={matterId} />}
        </div>
      </div>

      {syncMatch && (
        <DocumentMatterMatchDialog
          preview={syncMatch}
          fileName="pending upload(s)"
          busy={syncing}
          onUseMatch={() => void forgeSync({ targetMatterId: syncMatch.bestMatch!.matterId })}
          onKeepCurrent={() => void forgeSync({ confirmMismatch: true })}
          onCancel={() => setSyncMatch(null)}
        />
      )}

      <CourtPacketPreviewDrawer
        matterId={matterId}
        open={courtPreviewOpen}
        onClose={() => setCourtPreviewOpen(false)}
      />
    </>
  );
}

export function ForgeWorkspace({ matterId }: { matterId: string }) {
  return (
    <div className="app-container">
      <StaffHeader />
      <Suspense fallback={<p>Loading forge…</p>}>
        <ForgeWorkspaceInner matterId={matterId} />
      </Suspense>
      <ReliefCopilotSheet matterId={matterId} phase="forge" />
    </div>
  );
}
