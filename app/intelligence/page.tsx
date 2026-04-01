"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnrichedPost, RiskTier } from "@/lib/types";
import { fetchCorpus, type CorpusPayload } from "@/lib/corpus-client";
import { CriticalBanner, RiskBadge } from "@/components/RiskBadge";

type SortKey = "date" | "score" | "subreddit";

const tiers: RiskTier[] = ["critical", "elevated", "moderate", "low"];

export default function IntelligencePage() {
  const [data, setData] = useState<CorpusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<RiskTier | "all">("all");
  const [subFilter, setSubFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = [...data.posts];
    if (tierFilter !== "all") {
      rows = rows.filter((p) => p.analysis.tier === tierFilter);
    }
    const q = subFilter.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          p.subreddit.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q),
      );
    }
    if (sort === "date") {
      rows.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sort === "score") {
      rows.sort((a, b) => b.analysis.score - a.analysis.score);
    } else {
      rows.sort((a, b) => a.subreddit.localeCompare(b.subreddit));
    }
    return rows;
  }, [data, tierFilter, subFilter, sort]);

  const criticalOpen = useMemo(
    () => filtered.filter((p) => p.analysis.tier === "critical").length,
    [filtered],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-tactical-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-white">
            Intelligence records
          </h2>
          <p className="mt-1 max-w-2xl font-mono text-sm text-tactical-muted">
            Full thread view for analysts. Expand a row for body text, model path
            (Gemini vs heuristic), and coded-language notes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="self-start rounded border border-tactical-border px-3 py-2 font-mono text-xs uppercase tracking-wider text-tactical-muted hover:border-tactical-accent hover:text-tactical-accent"
        >
          Reload corpus
        </button>
      </header>

      {criticalOpen > 0 && (
        <CriticalBanner>
          <span className="font-semibold">
            {criticalOpen} critical thread(s) in current filter.
          </span>
          <p className="mt-1 text-xs text-red-200/80">
            Escalate per unit SOP. This UI is unclassified demo data.
          </p>
        </CriticalBanner>
      )}

      {err && (
        <div className="rounded border border-tactical-red/60 bg-tactical-red/10 px-4 py-3 font-mono text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-tactical-border bg-tactical-panel/50 p-4 lg:flex-row lg:flex-wrap lg:items-center">
        <label className="flex items-center gap-2 font-mono text-xs text-tactical-muted">
          Tier
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as RiskTier | "all")}
            className="rounded border border-tactical-border bg-tactical-black px-2 py-1 text-tactical-cyan"
          >
            <option value="all">All</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 items-center gap-2 font-mono text-xs text-tactical-muted lg:min-w-[200px]">
          Filter
          <input
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            placeholder="subreddit, user, title…"
            className="w-full rounded border border-tactical-border bg-tactical-black px-2 py-1 text-sm text-white placeholder:text-tactical-muted"
          />
        </label>
        <label className="flex items-center gap-2 font-mono text-xs text-tactical-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded border border-tactical-border bg-tactical-black px-2 py-1 text-tactical-cyan"
          >
            <option value="date">Newest</option>
            <option value="score">Risk score</option>
            <option value="subreddit">Subreddit</option>
          </select>
        </label>
      </div>

      {!data && (
        <p className="font-mono text-sm text-tactical-muted">Loading records…</p>
      )}

      {data && (
        <div className="space-y-2">
          <p className="font-mono text-[11px] text-tactical-muted">
            Showing {filtered.length} of {data.posts.length} · {data.modelNote}
          </p>
          <ul className="space-y-2">
            {filtered.map((p) => (
              <ThreadRow
                key={p.id}
                post={p}
                open={expanded === p.id}
                onToggle={() => setExpanded((id) => (id === p.id ? null : p.id))}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThreadRow({
  post: p,
  open,
  onToggle,
}: {
  post: EnrichedPost;
  open: boolean;
  onToggle: () => void;
}) {
  const dt = new Date(p.createdAt);
  return (
    <li className="panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge tier={p.analysis.tier} score={p.analysis.score} />
            <span className="font-mono text-[11px] text-tactical-muted">
              {dt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <p className="font-display text-base font-medium text-white">{p.title}</p>
          <p className="font-mono text-[11px] text-tactical-muted">
            r/{p.subreddit} · u/{p.author} · Reddit ↑ {p.redditScore} ·{" "}
            {p.numComments} comments
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-tactical-accent">
          {open ? "▼" : "▶"} details
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-tactical-border bg-black/30 px-4 py-4 font-mono text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-tactical-muted">
              Body
            </p>
            <p className="mt-1 whitespace-pre-wrap text-tactical-muted">{p.body}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-tactical-muted">
                Summary
              </p>
              <p className="mt-1 text-white">{p.analysis.summary}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-tactical-muted">
                Threat rationale
              </p>
              <p className="mt-1 text-tactical-muted">{p.analysis.threatRationale}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-tactical-amber">
              Coded language / context
            </p>
            <p className="mt-1 text-tactical-amber/90">{p.analysis.codedLanguageNotes}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-tactical-muted">
            <span>
              Model:{" "}
              <span className="text-tactical-cyan">{p.analysis.model}</span>
            </span>
            <span>
              Permalink:{" "}
              <code className="text-tactical-accent">{p.permalink}</code>
            </span>
          </div>
        </div>
      )}
    </li>
  );
}
