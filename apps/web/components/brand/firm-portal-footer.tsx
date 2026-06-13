import Link from "next/link";
import { FIRM } from "@/lib/firm";

export function FirmPortalFooter() {
  const pi = FIRM.personalInjury;
  if (!pi.enabled) return null;

  return (
    <footer className="mt-14 space-y-4 border-t border-[#e8e4dc] pt-8 text-center">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#8a8278]">
        {FIRM.name}
      </p>
      <p className="text-xs leading-relaxed text-[#6b6560]">
        {pi.subtleHint}{" "}
        <Link
          href={pi.path}
          className="font-medium text-[#1a2744] underline decoration-[#b8975a]/40 underline-offset-2 transition hover:decoration-[#b8975a]"
        >
          {pi.subtleLink}
        </Link>
      </p>
    </footer>
  );
}
