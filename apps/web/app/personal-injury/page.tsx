import Link from "next/link";
import { LomberaLogo } from "@/components/brand/lombera-logo";
import { FIRM } from "@/lib/firm";

export const metadata = {
  title: `Personal Injury — ${FIRM.name}`,
  description: "Discreet personal injury counsel from the same office you already trust.",
};

export default function PersonalInjuryPage() {
  const { phone } = FIRM.personalInjury;

  return (
    <div className="lombera-hero min-h-screen">
      <div className="mx-auto max-w-lg px-6 py-14 pb-20">
        <header className="mb-10 text-center">
          <LomberaLogo variant="hero" />
        </header>

        <article className="lombera-card space-y-5 p-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#8a8278]">
            Personal injury
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0f1c2e]">
            When an accident adds to the burden
          </h1>
          <p className="text-sm leading-relaxed text-[#4a5568]">
            Bankruptcy and injury claims are separate matters — but they often touch the same season
            of life. If you or someone close to you was hurt in a crash, fall, or workplace incident,
            our office can evaluate whether you have a personal injury claim.
          </p>
          <p className="text-sm leading-relaxed text-[#4a5568]">
            There is no pressure and no cost for an initial conversation. We will tell you honestly
            whether we can help.
          </p>
          <div className="border-t border-[#e8e4dc] pt-5">
            <p className="text-sm font-medium text-[#0f1c2e]">Reach our office</p>
            <a
              href={`tel:${phone.replace(/\D/g, "")}`}
              className="mt-1 inline-block text-sm text-[#1a2744] underline decoration-[#b8975a]/50 underline-offset-2"
            >
              {phone}
            </a>
          </div>
        </article>

        <p className="mt-8 text-center text-xs text-[#8a8278]">
          <Link href="/matters" className="hover:text-[#1a2744]">
            Attorney sign-in
          </Link>
          <span className="mx-2 opacity-40">·</span>
          Returning to your portal? Use the secure link your attorney sent you.
        </p>
      </div>
    </div>
  );
}
