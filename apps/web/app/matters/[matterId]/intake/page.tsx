import { redirect } from "next/navigation";

export default async function IntakeRedirect({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  redirect(`/matters/${matterId}/forge?section=dossier`);
}
