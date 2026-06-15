"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sticky bottom nav — always visible on phone for staff workflows */
export function StaffBottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/matters", label: "Matters", icon: "📋" },
    { href: "/field-capture", label: "Phone", icon: "📱" },
  ] as const;

  return (
    <nav className="app-staff-bottom-nav" aria-label="Staff navigation">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href === "/matters" && pathname.startsWith("/matters/") && pathname !== "/matters/new");
        return (
          <Link
            key={link.href}
            href={link.href}
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
