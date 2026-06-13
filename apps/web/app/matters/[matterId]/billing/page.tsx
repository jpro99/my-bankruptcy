import { BillingPanel } from "@/components/billing/billing-panel";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <MatterShell matterId={matterId}>
      <BillingPanel matterId={matterId} />
    </MatterShell>
  );
}
