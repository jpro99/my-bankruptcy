import { AuditTrail } from "@/components/audit/audit-trail";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return (
    <MatterShell matterId={matterId}>
      <AuditTrail matterId={matterId} />
    </MatterShell>
  );
}
