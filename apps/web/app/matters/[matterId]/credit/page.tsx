import { CreditReviewPanel } from "@/components/credit/credit-review-panel";
import { MatterShell } from "@/components/layout/matter-shell";

export default async function CreditReviewPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  return (
    <MatterShell matterId={matterId}>
      <CreditReviewPanel matterId={matterId} />
    </MatterShell>
  );
}
