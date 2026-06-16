"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { LomberaLogo } from "@/components/brand/lombera-logo";
import { useTestMode } from "@/lib/test-mode";
import { StaffBottomNav } from "./staff-bottom-nav";

export function StaffHeader() {
  const { testMode, appHref } = useTestMode();

  return (
    <>
      <header className="app-staff-header">
        <Link href={appHref("/matters")} className="app-staff-header__brand">
          <LomberaLogo variant="compact" />
        </Link>
        <nav className="app-staff-header__tabs" aria-label="Live or test">
          <Link
            href="/dashboard"
            className={`app-staff-header__tab${!testMode ? " app-staff-header__tab--active" : ""}`}
          >
            Live
          </Link>
          <Link
            href="/test/dashboard"
            className={`app-staff-header__tab app-staff-header__tab--test${testMode ? " app-staff-header__tab--active" : ""}`}
          >
            Test
          </Link>
        </nav>
        <nav className="app-staff-header__actions">
          <Link href={appHref("/dashboard")} className="app-btn app-btn--tonal">
            Dashboard
          </Link>
          <Link href={appHref("/matters")} className="app-btn app-btn--tonal">
            All Matters
          </Link>
          {!testMode && (
            <Link href={appHref("/matters/new")} className="app-btn app-btn--primary">
              + New Matter
            </Link>
          )}
          {testMode && (
            <Link href={appHref("/matters/demo/scout")} className="app-btn app-btn--primary">
              Demo walkthrough
            </Link>
          )}
          <Link
            href={appHref("/settings")}
            className="app-btn app-btn--secondary app-staff-header__settings"
            title="Settings"
          >
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
        </nav>
      </header>
      <StaffBottomNav />
    </>
  );
}
