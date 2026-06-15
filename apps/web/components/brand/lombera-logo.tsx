import { cn } from "@/lib/utils";
import { FIRM } from "@/lib/firm";

type LomberaLogoProps = {
  variant?: "hero" | "full" | "compact" | "mark";
  className?: string;
  invert?: boolean;
  showWordmark?: boolean;
};

function FirmWordmark({
  size = "hero",
  invert = false,
  className,
}: {
  size?: "hero" | "full" | "compact" | "mark";
  invert?: boolean;
  className?: string;
}) {
  const dark = invert;
  return (
    <div
      className={cn(
        "firm-wordmark",
        size === "hero" && "firm-wordmark--hero",
        size === "compact" && "firm-wordmark--compact",
        size === "mark" && "firm-wordmark--mark",
        dark && "firm-wordmark--invert",
        className
      )}
      role="img"
      aria-label={FIRM.name}
    >
      <p className="firm-wordmark__line">The Law Offices of</p>
      <p className="firm-wordmark__name">{FIRM.attorneyName}</p>
      {size !== "mark" && size !== "compact" ? (
        <p className="firm-wordmark__sub">{FIRM.descriptor}</p>
      ) : null}
    </div>
  );
}

export function LomberaLogo({
  variant = "full",
  className,
  invert = false,
}: LomberaLogoProps) {
  const size =
    variant === "hero" ? "hero" : variant === "compact" || variant === "mark" ? "compact" : "full";
  return <FirmWordmark size={size} invert={invert} className={className} />;
}
