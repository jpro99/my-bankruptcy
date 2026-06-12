import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">ChapterAI</h1>
        <p className="text-lg text-[var(--muted-foreground)]">
          AI-native bankruptcy practice platform. The attorney clicks Approve — nothing else.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/matters/demo/cockpit"
            className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90 transition"
          >
            Open Matter Cockpit
          </Link>
          <Link
            href="/matters/demo/intake"
            className="px-6 py-3 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition"
          >
            Start Intake
          </Link>
        </div>
      </div>
    </main>
  );
}
