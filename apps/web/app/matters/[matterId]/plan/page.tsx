import { Ch13PlanBuilder } from "@/components/plan/ch13-plan-builder";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function PlanPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  return (
    <MatterShell matterId={matterId}>
      <Ch13PlanBuilder matterId={matterId} />
    </MatterShell>
  );
}
