"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Scale } from "lucide-react";
import { fetchMatterCourtReadiness, type CourtReadiness } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DistrictCourtReadiness({ matterId }: { matterId: string }) {
  const [data, setData] = useState<{
    readiness: CourtReadiness;
    formsInPracticePacket: number;
    formsMatchDistrict: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchMatterCourtReadiness(matterId)
      .then((res) =>
        setData({
          readiness: res.readiness,
          formsInPracticePacket: res.formsInPracticePacket,
          formsMatchDistrict: res.formsMatchDistrict,
        })
      )
      .finally(() => setLoading(false));
  }, [matterId]);

  if (loading) {
    return (
      <div className="district-readiness district-readiness--loading">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading court connections…</span>
      </div>
    );
  }

  if (!data) return null;

  const { readiness, formsInPracticePacket, formsMatchDistrict } = data;

  return (
    <section className="district-readiness" aria-label="Court readiness">
      <div className="district-readiness__header">
        <Scale className="size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="district-readiness__title">
            {readiness.county} County · {readiness.district} · {readiness.division.name} Division
          </p>
          <p className="district-readiness__sub">
            {readiness.courtName} · {readiness.division.courthouse}
          </p>
        </div>
        <Badge variant={readiness.connections.practiceReady ? "success" : "warning"}>
          {readiness.connections.practiceReady ? "Practice ready" : "Needs setup"}
        </Badge>
      </div>

      <div className="district-readiness__grid">
        <div className="district-readiness__stat">
          <span className="district-readiness__stat-label">CM/ECF</span>
          <span className="district-readiness__stat-value">{readiness.connections.cmEcf}</span>
        </div>
        <div className="district-readiness__stat">
          <span className="district-readiness__stat-label">Forms in packet</span>
          <span className="district-readiness__stat-value">
            {formsInPracticePacket}/{readiness.requiredForms.length}
            {formsMatchDistrict && (
              <CheckCircle2 className="inline size-3.5 text-emerald-600 ml-1" aria-label="Complete" />
            )}
          </span>
        </div>
        <div className="district-readiness__stat">
          <span className="district-readiness__stat-label">Chapter</span>
          <span className="district-readiness__stat-value">{readiness.chapter}</span>
        </div>
      </div>

      <div className="district-readiness__counties">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span>
          Same division counties:{" "}
          <strong>{readiness.surroundingCounties.join(", ")}</strong>
        </span>
      </div>

      <details className="district-readiness__forms">
        <summary>
          All {readiness.requiredForms.length} required forms ({readiness.localFormIds.length} CACB
          local)
        </summary>
        <ul className="district-readiness__form-list">
          {readiness.requiredForms.map((form) => (
            <li
              key={form.formId}
              className={cn(
                "district-readiness__form-item",
                `district-readiness__form-item--${form.category}`
              )}
            >
              <span className="font-mono text-xs">{form.formId}</span>
              <span>{form.label}</span>
              <Badge variant="secondary" className="text-[9px] capitalize">
                {form.category}
              </Badge>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
