"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchIntegrationsStatus } from "@/lib/api-client";

type IntegrationBlock = {
  status: string;
  note?: string;
  provider?: string;
  fromAddress?: string | null;
  missing?: string[];
  bridge?: string;
  firmName?: string;
  url?: string | null;
  phone?: string | null;
};

export function IntegrationsPanel() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchIntegrationsStatus>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchIntegrationsStatus()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loader2 className="size-5 animate-spin text-primary" />;
  }

  if (!data) return null;

  const rows: { label: string; block: IntegrationBlock }[] = [
    { label: "Database", block: data.integrations.database },
    { label: "Outbound email", block: data.integrations.outboundEmail },
    { label: "Client Vault", block: data.integrations.clientPortal },
    { label: "Credit pull", block: data.integrations.creditPull },
    { label: "CM/ECF e-file", block: data.integrations.efile },
    { label: "Counseling", block: data.integrations.counseling },
    { label: "PI cross-sell", block: data.integrations.piCrossSell },
  ];

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2 className="matters-page__subtitle">Integrations & court connections</h2>
      <div className="dashboard-tiles">
        {rows.map(({ label, block }) => (
          <div key={label} className="dashboard-tile" style={{ cursor: "default" }}>
            <div className="dashboard-tile__value" style={{ fontSize: "0.85rem" }}>
              {block.status.replace(/_/g, " ")}
            </div>
            <div className="dashboard-tile__label">{label}</div>
            {block.note && (
              <p className="text-xs text-muted-foreground" style={{ marginTop: "0.35rem" }}>
                {block.note}
              </p>
            )}
          </div>
        ))}
      </div>
      {data.filingPackage?.note && (
        <p className="text-xs text-muted-foreground" style={{ marginTop: "0.75rem" }}>
          Filing forms: {data.filingPackage.formsIncluded.slice(0, 6).join(", ")}… —{" "}
          {data.filingPackage.note}
        </p>
      )}
    </section>
  );
}
