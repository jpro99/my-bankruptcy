import Link from "next/link";
import { LomberaLogo } from "@/components/brand/lombera-logo";
import { BackButton } from "@/components/layout/back-button";
import { StaffBottomNav } from "./staff-bottom-nav";

export function StaffHeader() {
  return (
    <>
      <header className="app-staff-header">
        <BackButton className="app-btn app-btn--tonal" />
        <Link href="/matters" className="app-staff-header__brand">
          <LomberaLogo variant="compact" />
        </Link>
        <nav className="app-staff-header__actions">
          <Link href="/dashboard" className="app-btn app-btn--tonal">
            Dashboard
          </Link>
          <Link href="/matters" className="app-btn app-btn--tonal">
            All Matters
          </Link>
          <Link href="/matters/new" className="app-btn app-btn--primary">
            + New Matter
          </Link>
          <Link href="/field-capture" className="app-btn app-btn--secondary">
            Field capture
          </Link>
        </nav>
      </header>
      <StaffBottomNav />
    </>
  );
}
