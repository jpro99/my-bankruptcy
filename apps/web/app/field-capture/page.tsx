import { Suspense } from "react";
import { FieldCaptureGate } from "@/components/field-capture/field-capture-gate";

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
        <FieldCaptureGate />
      </Suspense>
    </main>
  );
}
