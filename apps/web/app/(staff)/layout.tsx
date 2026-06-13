import "@/styles/staff-chrome.css";
import { StaffHeader } from "@/components/staff/staff-header";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <StaffHeader />
      {children}
    </div>
  );
}
