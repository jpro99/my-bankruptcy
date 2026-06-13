import { MobileMatterActions } from "@/components/mobile/mobile-matter-actions";

export default async function MobileMatterPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return <MobileMatterActions matterId={matterId} />;
}
