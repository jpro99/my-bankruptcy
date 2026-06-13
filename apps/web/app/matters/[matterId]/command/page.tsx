import { CommandCenter } from "@/components/command/command-center";
import { MatterTree } from "@/components/cockpit/matter-tree";

export default async function CommandPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <div className="flex h-screen">
      <MatterTree matterId={matterId} />
      <main className="flex-1 overflow-y-auto p-8">
        <CommandCenter matterId={matterId} />
      </main>
    </div>
  );
}
