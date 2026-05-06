import type { RiskTier } from "@/lib/types";
import { tierLabel } from "@/lib/types";

const tierStyles: Record<RiskTier, string> = {
  low: "border-slate-300 bg-slate-100 text-slate-700",
  moderate:
    "border-cyan-700/40 bg-cyan-50 text-cyan-900",
  elevated:
    "border-amber-700/45 bg-amber-50 text-amber-900",
  critical:
    "border-red-700 bg-red-100 text-red-900 font-semibold",
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
    <div className="flex items-start gap-3 rounded-lg border-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-medium text-red-950 shadow-sm">
      <span className="shrink-0 self-center animate-pulse font-mono text-lg leading-none text-red-600">
        ▌
      </span>
      <div className="min-w-0 leading-snug">{children}</div>
    </div>
  );
}
