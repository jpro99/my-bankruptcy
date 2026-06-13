import { redirect } from "next/navigation";

export default async function CockpitRedirect({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  redirect(`/matters/${matterId}/forge`);
}
