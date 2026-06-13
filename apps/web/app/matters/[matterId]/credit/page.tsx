import { redirect } from "next/navigation";

export default async function CreditRedirect({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  redirect(`/matters/${matterId}/forge?section=credit`);
}
