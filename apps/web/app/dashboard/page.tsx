"use client";

import { StaffHeader } from "@/components/staff/staff-header";
import { FirmDashboard } from "@/components/staff/firm-dashboard";
import "@/styles/staff-chrome.css";

export default function DashboardPage() {
  return (
    <div className="app-container">
      <StaffHeader />
      <FirmDashboard />
    </div>
  );
}
