import { Suspense } from "react";
import FieldCaptureClient from "@/components/field-capture/field-capture-client";

export default function FieldCapturePage() {
  return (
    <main className="field-capture-page-root">
      <Suspense
        fallback={
          <div className="field-capture-shell" style={{ padding: "1.5rem", color: "#94a3b8" }}>
            Loading…
          </div>
        }
      >
        <FieldCaptureClient />
      </Suspense>
    </main>
  );
}
