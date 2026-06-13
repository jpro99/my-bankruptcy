import { ClientPortal } from "@/components/portal/client-portal";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientPortal token={token} />;
}
