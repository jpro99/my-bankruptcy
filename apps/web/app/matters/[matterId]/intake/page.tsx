import { IntakeUploader } from "@/components/intake/intake-uploader";

interface IntakePageProps {
  params: Promise<{ matterId: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { matterId } = await params;
  return (
    <main className="min-h-screen p-8">
      <IntakeUploader matterId={matterId} />
    </main>
  );
}
