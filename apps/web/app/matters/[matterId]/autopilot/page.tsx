import { AutopilotDashboard } from "@/components/autopilot/autopilot-dashboard";
import { MatterTree } from "@/components/cockpit/matter-tree";

export default async function AutopilotPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <div className="flex h-screen">
      <MatterTree matterId={matterId} />
      <main className="flex-1 overflow-y-auto p-8">
        <AutopilotDashboard matterId={matterId} />
      </main>
    </div>
  );
}
