import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold">
            Out of this world simple
          </p>
          <h1 className="text-5xl font-black tracking-tight">My Bankruptcy</h1>
          <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
            The easiest Chapter 7 &amp; 13 bankruptcies an attorney will ever complete.
            Drop documents → approve AI fields → one-click e-file → autopilot the rest.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/matters/demo/command"
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-lg"
          >
            ⭐ Command Center
          </Link>
          <Link
            href="/matters/demo/cockpit"
            className="px-8 py-4 border-2 border-[var(--border)] rounded-xl font-semibold hover:bg-[var(--muted)] transition"
          >
            Matter Cockpit
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-xs">
          {[
            { label: "Ch 7 flat fee", value: "$2,500" },
            { label: "Ch 13 flat fee", value: "$4,000" },
            { label: "E-file", value: "1 click" },
            { label: "Attorney work", value: "Approve only" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-[var(--border)] rounded-lg p-3">
              <p className="text-[var(--muted-foreground)]">{item.label}</p>
              <p className="font-bold text-sm mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center text-sm">
          <Link href="/matters/demo/intake" className="text-blue-600 hover:underline">
            Start intake →
          </Link>
          <Link href="/portal/demo-client" className="text-blue-600 hover:underline">
            Client portal demo →
          </Link>
        </div>
      </div>
    </main>
  );
}
