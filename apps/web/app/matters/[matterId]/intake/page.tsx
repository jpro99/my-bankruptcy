import { IntakeUploader } from "@/components/intake/intake-uploader";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  return (
    <MatterShell matterId={matterId}>
      <IntakeUploader matterId={matterId} />
    </MatterShell>
  );
}
