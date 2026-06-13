import Link from "next/link";

/** Sticky bottom nav — always visible on phone for staff workflows */
export function StaffBottomNav() {
  return (
    <nav className="app-staff-bottom-nav" aria-label="Staff navigation">
      <Link href="/dashboard" className="app-staff-bottom-nav__link">
        <span aria-hidden>🏠</span>
        Home
      </Link>
      <Link href="/matters" className="app-staff-bottom-nav__link">
        <span aria-hidden>📋</span>
        Matters
      </Link>
      <Link href="/matters/new" className="app-staff-bottom-nav__link app-staff-bottom-nav__link--primary">
        <span aria-hidden>➕</span>
        New
      </Link>
      <Link href="/field-capture" className="app-staff-bottom-nav__link">
        <span aria-hidden>📱</span>
        Phone
      </Link>
    </nav>
  );
}
