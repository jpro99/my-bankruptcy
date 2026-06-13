import { CommandCenter } from "@/components/command/command-center";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function CommandPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <MatterShell matterId={matterId}>
      <CommandCenter matterId={matterId} />
    </MatterShell>
  );
}
