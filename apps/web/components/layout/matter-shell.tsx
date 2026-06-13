"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gauge,
  Upload,
  Calculator,
  Plane,
  Wallet,
  Home,
  ChevronRight,
  Scale,
  FileStack,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiStatusDot } from "@/components/layout/api-status-banner";

const MATTER_LINKS = [
  { id: "command", href: (id: string) => `/matters/${id}/command`, label: "Command Center", icon: LayoutDashboard },
  { id: "cockpit", href: (id: string) => `/matters/${id}/cockpit`, label: "Cockpit", icon: Gauge },
  { id: "credit", href: (id: string) => `/matters/${id}/credit`, label: "Credit Review", icon: CreditCard },
  { id: "schedules", href: (id: string) => `/matters/${id}/schedules`, label: "Schedules", icon: FileStack },
  { id: "intake", href: (id: string) => `/matters/${id}/intake`, label: "Intake", icon: Upload },
  { id: "plan", href: (id: string) => `/matters/${id}/plan`, label: "Ch 13 Plan", icon: Calculator },
  { id: "autopilot", href: (id: string) => `/matters/${id}/autopilot`, label: "Autopilot", icon: Plane },
  { id: "billing", href: (id: string) => `/matters/${id}/billing`, label: "Fees & Trust", icon: Wallet },
  { id: "audit", href: (id: string) => `/matters/${id}/audit`, label: "Audit Trail", icon: ShieldCheck },
];

const FORM_SECTIONS = [
  { id: "petition", label: "Petition (101)" },
  { id: "schedules", label: "Schedules A–J" },
  { id: "sofa", label: "SOFA" },
  { id: "means", label: "Means Test" },
  { id: "local", label: "CA Local Forms" },
  { id: "filing", label: "Filing Packet" },
];

export function MatterSidebar({ matterId }: { matterId: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-active bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-active p-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">My Bankruptcy</p>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-muted">CACB · Demo</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
          Matter
        </p>
        <ul className="space-y-0.5">
          {MATTER_LINKS.map((link) => {
            const href = link.href(matterId);
            const active = pathname === href;
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
          href="/"
          className="flex items-center gap-2 text-xs text-sidebar-muted transition hover:text-white"
        >
          <Home className="size-3.5" />
          Back to home
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
    <div className="flex min-h-screen bg-background">
      <MatterSidebar matterId={matterId} />
      <main className={cn("flex-1 overflow-y-auto p-6 md:p-8", className)}>{children}</main>
    </div>
  );
}
