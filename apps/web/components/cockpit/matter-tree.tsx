"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MATTER_LINKS = [
  { id: "command", href: (id: string) => `/matters/${id}/command`, label: "⭐ Command Center" },
  { id: "cockpit", href: (id: string) => `/matters/${id}/cockpit`, label: "Cockpit" },
  { id: "intake", href: (id: string) => `/matters/${id}/intake`, label: "One-Touch Intake" },
  { id: "plan", href: (id: string) => `/matters/${id}/plan`, label: "Ch 13 Plan Builder" },
  { id: "autopilot", href: (id: string) => `/matters/${id}/autopilot`, label: "Post-Petition Autopilot" },
  { id: "billing", href: (id: string) => `/matters/${id}/billing`, label: "Fees & Trust" },
];

const MATTER_TREE = [
  { id: "petition", label: "Petition (101)", children: [] },
  {
    id: "schedules",
    label: "Schedules",
    children: [
      { id: "ab", label: "A/B — Property" },
      { id: "c", label: "C — Exemptions" },
      { id: "d", label: "D — Secured" },
      { id: "ef", label: "E/F — Unsecured" },
      { id: "g", label: "G — Executory" },
      { id: "h", label: "H — Codebtors" },
      { id: "i", label: "I — Income" },
      { id: "j", label: "J — Expenses" },
    ],
  },
  { id: "sofa", label: "Statement of Financial Affairs", children: [] },
  { id: "means", label: "Means Test (122A/C)", children: [] },
  { id: "local", label: "CA Local Forms", children: [] },
  { id: "filing", label: "Filing Packet", children: [] },
];

interface MatterTreeProps {
  matterId?: string;
  activeSection?: string;
  onSelect?: (sectionId: string) => void;
}

export function MatterTree({ matterId = "demo", activeSection = "ef", onSelect }: MatterTreeProps) {
  const pathname = usePathname();

  return (
    <nav className="w-56 border-r border-[var(--border)] bg-white p-4 overflow-y-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">
        Matter
      </h2>
      <ul className="space-y-1 mb-6">
        {MATTER_LINKS.map((link) => {
          const href = link.href(matterId);
          const active = pathname === href;
          return (
            <li key={link.id}>
              <Link
                href={href}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded transition ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">
        Forms
      </h2>
      <ul className="space-y-1">
        {MATTER_TREE.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item.id)}
              className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-[var(--muted)] transition font-medium"
            >
              {item.label}
            </button>
            {item.children.length > 0 && (
              <ul className="ml-3 mt-1 space-y-0.5">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(child.id)}
                      className={`w-full text-left text-xs py-1 px-2 rounded transition ${
                        activeSection === child.id
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      {child.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
