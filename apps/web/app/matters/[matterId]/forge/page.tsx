import { MatterForge } from "@/components/forge/matter-forge";

export default async function ForgePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return <MatterForge matterId={matterId} />;
}
