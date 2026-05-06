"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnrichedPost } from "@/lib/types";
import { fetchCorpus, type CorpusPayload } from "@/lib/corpus-client";
import { CriticalBanner, RiskBadge } from "@/components/RiskBadge";

/** Leadership view: elevated + critical only, critical ordered first. */
function leadershipPosts(posts: EnrichedPost[]): EnrichedPost[] {
  const hi = posts.filter(
    (p) => p.analysis.tier === "critical" || p.analysis.tier === "elevated",
  );
  hi.sort((a, b) => {
    if (a.analysis.tier === b.analysis.tier) {
      return b.analysis.score - a.analysis.score;
    }
    return a.analysis.tier === "critical" ? -1 : 1;
  });
  return hi;
}

export default function CommandPage() {
  const [data, setData] = useState<CorpusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const payload = await fetchCorpus("day", false);
      setData(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => (data ? leadershipPosts(data.posts) : []), [data]);
  const criticalCount = items.filter((p) => p.analysis.tier === "critical").length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b border-tactical-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tactical-red">
          Command eyes only · time-constrained
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-tactical-black">
          Garrison summary
        </h2>
        <p className="mt-2 text-base leading-snug text-slate-800">
          Curated high-risk signals from open-source Reddit discussion relevant
          to the installation AOI. Benign and routine threads are removed.
          Critical items warrant immediate staff sync; elevated items merit
          awareness and correlation.
        </p>
      </header>

      {err && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {err}
        </div>
      )}

      {!data && (
        <p className="font-mono text-sm text-tactical-muted">Loading…</p>
      )}

      {data && criticalCount > 0 && (
        <CriticalBanner>
          {criticalCount} critical item(s) require command attention today (demo
          scoring).
        </CriticalBanner>
      )}

      {data && items.length === 0 && (
        <div className="panel p-8 text-center font-mono text-sm text-tactical-muted">
          No elevated or critical threads in current corpus. (Demo seed may
          change when LLM key alters scores.)
        </div>
      )}

      {data && items.length > 0 && (
        <div className="space-y-4">
          <p className="font-mono text-[11px] text-tactical-muted">
            {items.length} item(s) · Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
          <ul className="space-y-4">
            {items.map((p) => (
              <li
                key={p.id}
                className={`panel p-5 ${
                  p.analysis.tier === "critical"
                    ? "ring-1 ring-tactical-red/50"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge tier={p.analysis.tier} score={p.analysis.score} />
                  <span className="font-mono text-xs text-tactical-muted">
                    {new Date(p.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · r/{p.subreddit}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-tactical-black">
                  {p.title}
                </h3>
                <div className="mt-3 rounded border border-tactical-border bg-tactical-surface">
                  <p className="border-b border-tactical-border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                    Thread body (source text)
                  </p>
                  <div className="max-h-56 overflow-y-auto px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                      {p.body.trim() || "— (no body in seed)"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 border-l-2 border-tactical-accent/50 pl-4">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      Executive summary
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-tactical-black">
                      {p.analysis.summary}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-tactical-red">
                      Why this threatens force protection
                    </p>
                    <p className="mt-1 text-sm leading-snug text-slate-800">
                      {p.analysis.threatRationale}
                    </p>
                  </div>
                  {p.analysis.codedLanguageNotes && (
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-800">
                        Context / possible coded language
                      </p>
                      <p className="mt-1 text-sm leading-snug text-amber-950">
                        {p.analysis.codedLanguageNotes}
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-4 font-mono text-[11px] text-tactical-muted">
                  Source handle: u/{p.author} · Model: {p.analysis.model}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
