import type { RiskTier } from "@/lib/types";
import { tierLabel } from "@/lib/types";

const tierStyles: Record<RiskTier, string> = {
  low: "border-tactical-border bg-white/5 text-tactical-muted",
  moderate: "border-tactical-cyan/40 bg-tactical-cyan/10 text-tactical-cyan",
  elevated: "border-tactical-amber/50 bg-tactical-amber/15 text-tactical-amber",
  critical:
    "border-tactical-red/70 bg-tactical-red/20 text-red-300 shadow-[0_0_20px_rgba(196,43,43,0.25)]",
};

export function RiskBadge({
  tier,
  score,
  showScore = true,
}: {
  tier: RiskTier;
  score?: number;
  showScore?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${tierStyles[tier]}`}
    >
      <span>{tierLabel(tier)}</span>
      {showScore && score != null && (
        <span className="opacity-80">· {score.toFixed(0)}/10</span>
      )}
    </span>
  );
}

export function CriticalBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-2 border-tactical-red bg-tactical-red/15 px-4 py-3 font-mono text-sm text-red-100">
      <span className="shrink-0 animate-pulse text-tactical-red">▌</span>
      <div>{children}</div>
    </div>
  );
}
