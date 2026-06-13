import { SchedulesViewer } from "@/components/schedules/schedules-viewer";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function SchedulesPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return (
    <MatterShell matterId={matterId}>
      <SchedulesViewer matterId={matterId} />
    </MatterShell>
  );
}
