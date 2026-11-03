import Image from "next/image";
import type { ReactNode } from "react";
import SoundControls from "@/components/SoundControls";

type BrandHeaderProps = {
  live?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Slim strip for projector/board screens */
  compact?: boolean;
  /** Right-side slot (e.g. sound / music buttons) */
  children?: ReactNode;
};

export function BrandHeader({
  live = true,
  title = "Southern Luzon State University",
  subtitle = "DOST Scholars’ Alliance · A.Y. 2026–2027",
  className = "",
  compact = false,
  children,
}: BrandHeaderProps) {
  return (
    <header
      className={`app-header ${className}`}
      style={compact ? { paddingTop: 6, paddingBottom: 6 } : undefined}
    >
      <Image
        src="/LOGO_NOTEXT.png"
        alt="SLSU × DOST SA seal"
        width={46}
        height={46}
        priority
        style={compact ? { height: 34, width: 34 } : undefined}
      />
      <div className="brand" style={compact ? { fontSize: ".9rem", lineHeight: 1.15 } : undefined}>
        {title}
        <small style={compact ? { fontSize: 10 } : undefined}>{subtitle}</small>
      </div>
      {live && (
        <div className="live">
          <i />
          LIVE
        </div>
      )}
      <div className={`flex items-center gap-1.5 ${live ? "" : "ml-auto"}`}>
        {children}
      </div>

      <div className={`flex items-center gap-1.5 ${live ? "" : "ml-auto"}`}>
        <SoundControls music={compact} />
            {children}
        </div>
    </header>
  );
}

const DEFAULT_TICKER = [
  "BATTLE OF THE SCHOLAR MINDS",
  "NOVEMBER 13, 2026",
  "8:00 AM – 12:00 NN",
  "LUCBAN, QUEZON",
  "30 SCHOLARS · 6 GROUPS · 45 ITEMS",
];

export function BrandTicker({ items = DEFAULT_TICKER }: { items?: string[] }) {
  return (
    <div className="ticker" aria-hidden="true">
      <div>
        {[...items, ...items].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default BrandHeader;