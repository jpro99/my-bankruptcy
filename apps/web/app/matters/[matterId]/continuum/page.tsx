import { ContinuumDashboard } from "@/components/continuum/continuum-dashboard";

export default async function ContinuumPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return <ContinuumDashboard matterId={matterId} />;
}
