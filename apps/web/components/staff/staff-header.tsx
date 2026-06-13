import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function StaffHeader() {
  return (
    <header className="app-staff-header">
      <Link href="/dashboard" className="app-staff-header__brand">
        {BRAND.name}
      </Link>
      <nav className="app-staff-header__actions">
        <Link href="/dashboard" className="app-btn app-btn--tonal">
          Dashboard
        </Link>
        <Link href="/matters" className="app-btn app-btn--tonal">
          Matters
        </Link>
        <Link href="/matters/new" className="app-btn app-btn--primary">
          New Matter
        </Link>
        <Link href="/field-capture" className="app-btn app-btn--secondary">
          Field capture (phone)
        </Link>
      </nav>
    </header>
  );
}
