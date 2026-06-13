import { AutopilotDashboard } from "@/components/autopilot/autopilot-dashboard";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function AutopilotPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <MatterShell matterId={matterId}>
      <AutopilotDashboard matterId={matterId} />
    </MatterShell>
  );
}
