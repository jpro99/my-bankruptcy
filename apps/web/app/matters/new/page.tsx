"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDemoMatter } from "@/lib/api-client";
import { StaffHeader } from "@/components/staff/staff-header";
import "@/styles/staff-chrome.css";

export default function NewMatterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [chapter, setChapter] = useState<"7" | "13">("7");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!name) return;
    setBusy(true);
    try {
      const { matter } = await createDemoMatter({
        debtorDisplayName: name,
        chapter,
      });
      router.push(`/matters/${matter.matterId}?tab=intake&welcome=intake`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-container">
      <StaffHeader />
    <main style={{ maxWidth: 480 }}>
      <h1 className="matters-page__title">New Matter</h1>
      <p className="matters-page__subtitle">
        Same flow as Demand Generator — client name, email for portal matching, chapter.
      </p>
      <form onSubmit={(e) => void submit(e)} style={{ display: "grid", gap: "0.75rem" }}>
        <label className="text-sm">
          Client first name
          <input
            className="w-full rounded-lg border px-3 py-2 mt-1"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Client last name
          <input
            className="w-full rounded-lg border px-3 py-2 mt-1"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Client email (optional — auto-match portal & comms)
          <input
            type="email"
            className="w-full rounded-lg border px-3 py-2 mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Chapter
          <select
            className="w-full rounded-lg border px-3 py-2 mt-1"
            value={chapter}
            onChange={(e) => setChapter(e.target.value as "7" | "13")}
          >
            <option value="7">Chapter 7</option>
            <option value="13">Chapter 13</option>
          </select>
        </label>
        <button type="submit" className="app-btn app-btn--primary" disabled={busy}>
          Create matter
        </button>
      </form>
      <p className="mt-4">
        <Link href="/matters" className="app-btn app-btn--tonal">
          ← Matters
        </Link>
      </p>
    </main>
    </div>
  );
}
