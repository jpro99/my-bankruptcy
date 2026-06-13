import { FilingPacketPanel } from "@/components/filing/filing-packet-panel";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function FilingPacketPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return (
    <MatterShell matterId={matterId}>
      <FilingPacketPanel matterId={matterId} />
    </MatterShell>
  );
}
