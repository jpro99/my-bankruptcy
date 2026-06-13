import { redirect } from "next/navigation";

export default async function CommandPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  redirect(`/matters/${matterId}/forge`);
}
