import { BillingPanel } from "@/components/billing/billing-panel";
import { MatterTree } from "@/components/cockpit/matter-tree";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <div className="flex h-screen">
      <MatterTree matterId={matterId} />
      <main className="flex-1 overflow-y-auto p-8">
        <BillingPanel matterId={matterId} />
      </main>
    </div>
  );
}
