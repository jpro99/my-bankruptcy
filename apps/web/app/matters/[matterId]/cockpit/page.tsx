import { MatterCockpit } from "@/components/cockpit/matter-cockpit";

interface CockpitPageProps {
  params: Promise<{ matterId: string }>;
}

export default async function CockpitPage({ params }: CockpitPageProps) {
  const { matterId } = await params;
  return <MatterCockpit matterId={matterId} />;
}
