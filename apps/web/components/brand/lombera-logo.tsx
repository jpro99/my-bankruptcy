import Image from "next/image";
import { cn } from "@/lib/utils";
import { FIRM } from "@/lib/firm";

type LomberaLogoProps = {
  variant?: "hero" | "full" | "compact" | "mark";
  className?: string;
  /** Light text on dark backgrounds (compact / hero wordmark) */
  invert?: boolean;
  /** Show wordmark text under crest (hero defaults true) */
  showWordmark?: boolean;
};

const CREST_SRC = "/icons/lombera-crest.png";

function CrestSvg({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="lombera-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4bc8a" />
          <stop offset="45%" stopColor="#b8975a" />
          <stop offset="100%" stopColor="#8a7044" />
        </linearGradient>
        <linearGradient id="lombera-navy" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a2744" />
          <stop offset="100%" stopColor="#0f1c2e" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="112" height="112" rx="14" stroke="url(#lombera-gold)" strokeWidth="1.5" fill="none" opacity="0.85" />
      <path
        d="M60 14 L92 28 V58 C92 78 78 94 60 102 C42 94 28 78 28 58 V28 Z"
        fill="url(#lombera-navy)"
        stroke="url(#lombera-gold)"
        strokeWidth="1.25"
      />
      <path
        d="M44 38 V78 H50.5 C58.5 78 63 73.5 63 66.5 C63 61 60 57 55.5 55 L66 38 H59 L51 52 H50.5 V38 H44 Z"
        fill="#faf9f7"
      />
      <path
        d="M68 38 H74 L84 78 H78.2 L76.8 72.5 H69.2 L67.8 78 H62 L68 38 Z M70.5 56.5 L72.8 48 L75.1 56.5 H70.5 Z"
        fill="url(#lombera-gold)"
      />
      <path d="M48 22 H72" stroke="url(#lombera-gold)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <circle cx="48" cy="22" r="2.5" fill="url(#lombera-gold)" opacity="0.8" />
      <circle cx="72" cy="22" r="2.5" fill="url(#lombera-gold)" opacity="0.8" />
      <path d="M54 22 C60 18 60 18 66 22" stroke="url(#lombera-gold)" strokeWidth="0.75" fill="none" opacity="0.55" />
    </svg>
  );
}

function Wordmark({
  invert,
  className,
}: {
  invert?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("lombera-crest-hero__wordmark", className)}>
      <p className="lombera-crest-hero__eyebrow">The Law Offices of</p>
      <p className="lombera-crest-hero__name">{FIRM.attorneyName}</p>
      <div className="lombera-crest-hero__rule" />
      <p className="lombera-crest-hero__tag">{FIRM.descriptor}</p>
    </div>
  );
}

export function LomberaLogo({
  variant = "full",
  className,
  invert = false,
  showWordmark,
}: LomberaLogoProps) {
  if (variant === "hero") {
    const showText = showWordmark ?? true;
    return (
      <div
        className={cn(
          "lombera-crest-hero",
          invert && "lombera-crest-hero--dark",
          className
        )}
        role="img"
        aria-label={FIRM.name}
      >
        <div className="lombera-crest-hero__glow" aria-hidden />
        <div className="lombera-crest-hero__frame">
          <Image
            src={CREST_SRC}
            alt={FIRM.name}
            width={520}
            height={520}
            priority
            className="lombera-crest-hero__image"
          />
        </div>
        {showText ? <Wordmark invert={invert} /> : null}
      </div>
    );
  }

  if (variant === "mark") {
    return (
      <div className={cn("inline-flex", className)}>
        <Image
          src={CREST_SRC}
          alt=""
          width={48}
          height={48}
          className="lombera-crest-compact__img"
        />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("lombera-crest-compact", className)}>
        <Image
          src={CREST_SRC}
          alt=""
          width={40}
          height={40}
          className="lombera-crest-compact__img"
        />
        <div className="text-left leading-tight">
          <p
            className="text-[0.55rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: invert ? "rgba(250,249,247,0.72)" : "#8a8278" }}
          >
            Law Offices of
          </p>
          <p
            className="font-display text-lg font-semibold tracking-tight"
            style={{ color: invert ? "#faf9f7" : FIRM.colors.navy }}
          >
            {FIRM.attorneyName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)}>
      <CrestSvg size={72} />
      <Wordmark invert={invert} />
    </div>
  );
}
