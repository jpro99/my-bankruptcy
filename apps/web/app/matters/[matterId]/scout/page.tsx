import { ReliefScoutPanel } from "@/components/scout/relief-scout-panel";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function ScoutPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <MatterShell matterId={matterId}>
      <ReliefScoutPanel matterId={matterId} />
    </MatterShell>
  );
}
