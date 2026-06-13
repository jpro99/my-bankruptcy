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
} from "lucide-react";
import { LomberaLogo } from "@/components/brand/lombera-logo";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ApiStatusDot } from "@/components/layout/api-status-banner";
import { BenchNotesSheet } from "@/components/notes/bench-notes-sheet";

const MATTER_LINKS = [
  {
    id: "matters",
    href: (_id: string) => `/matters`,
    label: "All Matters",
    icon: Home,
  },
  {
    id: "scout",
    href: (id: string) => `/matters/${id}/scout`,
    label: BRAND.reliefScout.name,
    icon: Compass,
  },
  {
    id: "forge",
    href: (id: string) => `/matters/${id}/forge`,
    label: BRAND.forge.name,
    icon: Hammer,
  },
  {
    id: "continuum",
    href: (id: string) => `/matters/${id}/continuum`,
    label: BRAND.continuum.name,
    icon: Route,
  },
  {
    id: "billing",
    href: (id: string) => `/matters/${id}/billing`,
    label: BRAND.trustLedger.name,
    icon: Wallet,
  },
  {
    id: "audit",
    href: (id: string) => `/matters/${id}/audit`,
    label: "Audit Trail",
    icon: ShieldCheck,
  },
];

const FORM_SECTIONS = [
  { id: "petition", label: "Petition (101)" },
  { id: "schedules", label: "Schedules A–J" },
  { id: "sofa", label: "SOFA" },
  { id: "means", label: "Means Test" },
  { id: "local", label: "CA Local Forms" },
  { id: "filing", label: "Petition Bundle" },
];

export function MatterSidebar({ matterId }: { matterId: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-active bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-active p-5">
        <Link href="/matters" className="block">
          <LomberaLogo variant="compact" invert />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
          Matter
        </p>
        <ul className="space-y-0.5">
          {MATTER_LINKS.map((link) => {
            const href = link.href(matterId);
            const active =
              pathname === href ||
              pathname.startsWith(href + "/") ||
              (link.id === "forge" && pathname.includes("/forge"));
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
          {FORM_SECTIONS.map((item) => (
            <li key={item.id}>
              <span className="block cursor-default rounded-lg px-3 py-2 text-xs text-sidebar-muted transition hover:bg-sidebar-active hover:text-sidebar-foreground">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-sidebar-active p-4">
        <ApiStatusDot />
        <Link
          href="/matters"
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
      <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      <BenchNotesSheet matterId={matterId} />
    </div>
  );
}
