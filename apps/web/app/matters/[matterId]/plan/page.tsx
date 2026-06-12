import { Ch13PlanBuilder } from "@/components/plan/ch13-plan-builder";

export default async function PlanPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  return (
    <main className="min-h-screen p-8">
      <Ch13PlanBuilder matterId={matterId} />
    </main>
  );
}
