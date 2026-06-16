"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTestMode } from "@/lib/test-mode";

/** Sticky bottom nav — always visible on phone for staff workflows */
export function StaffBottomNav() {
  const pathname = usePathname();
  const { testMode, appHref } = useTestMode();
  const normalized = pathname.replace(/^\/test/, "");

  const links = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/matters", label: "Matters", icon: "📋" },
    ...(!testMode ? [{ href: "/field-capture", label: "Phone", icon: "📱" as const }] : []),
  ] as const;

  return (
    <nav className="app-staff-bottom-nav" aria-label="Staff navigation">
      {links.map((link) => {
        const active =
          normalized === link.href ||
          (link.href === "/matters" &&
            normalized.startsWith("/matters/") &&
            normalized !== "/matters/new");
        return (
          <Link
            key={link.href}
            href={appHref(link.href)}
            className={`app-staff-bottom-nav__link${active ? " app-staff-bottom-nav__link--active" : ""}`}
          >
            <span aria-hidden>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
