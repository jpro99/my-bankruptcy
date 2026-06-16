"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hammer,
  Route,
  Wallet,
  Home,
  ChevronRight,
  ShieldCheck,
  Compass,
  Scale,
} from "lucide-react";
import { LomberaLogo } from "@/components/brand/lombera-logo";
import { BRAND } from "@/lib/brand";
import { useTestMode } from "@/lib/test-mode";
import { cn } from "@/lib/utils";
import { ApiStatusDot } from "@/components/layout/api-status-banner";
import { ReliefCopilotSheet } from "@/components/copilot/relief-copilot-sheet";
import { BenchNotesSheet } from "@/components/notes/bench-notes-sheet";

const MATTER_LINKS = [
  {
    id: "matters",
    href: (_id: string) => `/matters`,
    label: "All Matters",
    icon: Home,
    match: (path: string) => path === "/matters" || path === "/test/matters",
  },
  {
    id: "scout",
    href: (id: string) => `/matters/${id}/scout`,
    label: BRAND.reliefScout.name,
    icon: Compass,
    match: (path: string) => path.includes("/scout"),
  },
  {
    id: "forge",
    href: (id: string) => `/matters/${id}/forge`,
    label: BRAND.forge.name,
    icon: Hammer,
    match: (path: string) => path.includes("/forge"),
  },
  {
    id: "practice",
    href: (id: string) => `/matters/${id}/practice`,
    label: BRAND.practiceMode.short,
    icon: Scale,
    match: (path: string) => path.includes("/practice") || path.includes("/court-preview"),
  },
  {
    id: "continuum",
    href: (id: string) => `/matters/${id}/continuum`,
    label: BRAND.continuum.name,
    icon: Route,
    match: (path: string) => path.includes("/continuum"),
  },
  {
    id: "billing",
    href: (id: string) => `/matters/${id}/billing`,
    label: BRAND.trustLedger.name,
    icon: Wallet,
    match: (path: string) => path.includes("/billing"),
  },
  {
    id: "audit",
    href: (id: string) => `/matters/${id}/audit`,
    label: "Audit Trail",
    icon: ShieldCheck,
    match: (path: string) => path.includes("/audit"),
  },
];

const FORM_SECTIONS = [
  { id: "petition", label: "Petition (101)", href: (id: string) => `/matters/${id}/forge/review` },
  {
    id: "schedules",
    label: "Schedules A–J",
    href: (id: string) => `/matters/${id}/forge?section=schedules`,
  },
  { id: "sofa", label: "SOFA (107)", href: (id: string) => `/matters/${id}/forge?section=schedules&schedule=sofa` },
  { id: "means", label: "Means Test", href: (id: string) => `/matters/${id}/scout` },
  { id: "local", label: "CA Local Forms", href: (id: string) => `/matters/${id}/practice` },
  { id: "filing", label: "Petition Bundle", href: (id: string) => `/matters/${id}/forge?section=file` },
];

export function MatterSidebar({ matterId }: { matterId: string }) {
  const pathname = usePathname();
  const { appHref } = useTestMode();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-active bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-active p-5">
        <Link href={appHref("/matters")} className="block">
          <LomberaLogo variant="compact" invert />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
          Matter
        </p>
        <ul className="space-y-0.5">
          {MATTER_LINKS.map((link) => {
            const href = appHref(link.href(matterId));
            const active = link.match(pathname);
            const Icon = link.icon;
            return (
              <li key={link.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-primary font-semibold text-white shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-active"
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  {link.label}
                  {active && <ChevronRight className="ml-auto size-3.5 opacity-70" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
          Forms
        </p>
        <ul className="space-y-0.5">
          {FORM_SECTIONS.map((item) => {
            const href = appHref(item.href(matterId));
            const active = pathname.includes(href.split("?")[0] ?? href);
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-xs transition hover:bg-sidebar-active hover:text-sidebar-foreground",
                    active ? "bg-sidebar-active font-semibold text-white" : "text-sidebar-muted"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-sidebar-active p-4">
        <ApiStatusDot />
        <Link
          href={appHref("/matters")}
          className="flex items-center gap-2 text-xs text-sidebar-muted transition hover:text-white"
        >
          <Home className="size-3.5" />
          All Matters
        </Link>
      </div>
    </aside>
  );
}

export function MatterShell({
  matterId,
  children,
  className,
}: {
  matterId: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      <MatterSidebar matterId={matterId} />
      <main className="matter-shell__main">{children}</main>
      <ReliefCopilotSheet matterId={matterId} phase="forge" />
      <BenchNotesSheet matterId={matterId} />
    </div>
  );
}
