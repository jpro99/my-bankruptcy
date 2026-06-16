"use client";



import Link from "next/link";

import { StaffHeader } from "@/components/staff/staff-header";

import { MatterOpsBoard } from "@/components/staff/matter-ops-board";

import { useTestMode } from "@/lib/test-mode";

import "@/styles/staff-chrome.css";



export default function MattersListPage() {

  const { testMode, appHref } = useTestMode();



  return (

    <div className="app-container">

      <StaffHeader />

      <main className="matters-page">

        <div className="matters-page__header-row">

          <div className="matters-page__header">

            <h1 className="matters-page__title">All Matters</h1>

            <p className="matters-page__subtitle">

              Search by name, phone, or email — filter Potential, Active Cases, or Completed — receipt in one click.

            </p>

          </div>

          {!testMode && (

            <Link href={appHref("/matters/new")} className="app-btn app-btn--primary">

              + New Matter

            </Link>

          )}

        </div>



        <MatterOpsBoard />

      </main>

    </div>

  );

}

