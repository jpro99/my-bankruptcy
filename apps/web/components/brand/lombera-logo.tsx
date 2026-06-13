import { cn } from "@/lib/utils";
import { FIRM } from "@/lib/firm";

type LomberaLogoProps = {
  variant?: "full" | "compact" | "mark";
  className?: string;
  /** Light text on dark backgrounds */
  invert?: boolean;
};

const navy = FIRM.colors.navy;
const gold = FIRM.colors.gold;

function Monogram({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="47" height="47" rx="6" fill={navy} stroke={gold} strokeWidth="1" />
      <path
        d="M14 34V14h6.2c4.8 0 7.8 2.4 7.8 6.4 0 2.6-1.2 4.6-3.4 5.6L30 34h-5.2l-4.2-6.8H19.2V34H14zm5.2-10.6h1c2.2 0 3.4-1 3.4-2.8 0-1.8-1.2-2.8-3.4-2.8h-1v5.6z"
        fill="#faf9f7"
      />
      <path
        d="M31.5 14H36l5.5 20h-5.3l-.9-3.6h-5.8l-.9 3.6h-5.1L31.5 14zm3.8 12.2l-1.8-7.4-1.8 7.4h3.6z"
        fill={gold}
      />
      <line x1="8" y1="40" x2="40" y2="40" stroke={gold} strokeWidth="0.75" opacity="0.6" />
    </svg>
  );
}

export function LomberaLogo({ variant = "full", className, invert = false }: LomberaLogoProps) {
  const textPrimary = invert ? "#faf9f7" : navy;
  const textMuted = invert ? "rgba(250,249,247,0.72)" : "rgba(15,28,46,0.62)";
  const rule = gold;

  if (variant === "mark") {
    return (
      <div className={cn("inline-flex", className)}>
        <Monogram size={40} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-3", className)}>
        <Monogram size={36} />
        <div className="text-left leading-tight">
          <p
            className="text-[0.55rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: textMuted }}
          >
            Law Offices of
          </p>
          <p className="font-display text-lg font-semibold tracking-tight" style={{ color: textPrimary }}>
            {FIRM.attorneyName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)}>
      <Monogram size={52} />
      <div className="text-center">
        <p
          className="text-[0.6rem] font-semibold uppercase tracking-[0.28em]"
          style={{ color: textMuted }}
        >
          The Law Offices of
        </p>
        <p
          className="font-display mt-0.5 text-2xl font-semibold tracking-tight sm:text-[1.65rem]"
          style={{ color: textPrimary }}
        >
          {FIRM.attorneyName}
        </p>
        <div
          className="mx-auto mt-2 h-px w-16"
          style={{ background: `linear-gradient(90deg, transparent, ${rule}, transparent)` }}
        />
        <p className="mt-2 text-xs font-medium tracking-wide" style={{ color: textMuted }}>
          {FIRM.descriptor}
        </p>
      </div>
    </div>
  );
}
