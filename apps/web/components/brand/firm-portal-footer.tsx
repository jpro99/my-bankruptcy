import Link from "next/link";
import { FIRM } from "@/lib/firm";

export function FirmPortalFooter() {
  const pi = FIRM.personalInjury;
  if (!pi.enabled) return null;

  return (
    <footer className="mt-14 space-y-3 border-t border-[#d2d2d7] pt-8 text-center">
      <p className="text-xs text-[#86868b]">{FIRM.name}</p>
      <p className="text-xs leading-relaxed text-[#86868b]">
        {pi.subtleHint}{" "}
        <Link href={pi.path} className="text-[#1d1d1f] underline underline-offset-2">
          {pi.subtleLink}
        </Link>
      </p>
    </footer>
  );
}
