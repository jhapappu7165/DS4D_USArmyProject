"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeGranularity } from "@/lib/types";
import { fetchCorpus, type CorpusPayload } from "@/lib/corpus-client";
import { CriticalBanner } from "@/components/RiskBadge";

const granularities: { value: TimeGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function AnalyticsPage() {
  const [granularity, setGranularity] = useState<TimeGranularity>("week");
  const [data, setData] = useState<CorpusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const payload = await fetchCorpus(granularity, false);
      setData(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-white">
            Operations board
          </h2>
          <p className="mt-1 max-w-xl font-mono text-sm text-tactical-muted">
            Volume, subreddit attribution, and spike heuristics across the demo
            corpus. Granularity reshapes bucket boundaries for the time series.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {granularities.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGranularity(g.value)}
              className={`rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                granularity === g.value
                  ? "border-tactical-accent bg-tactical-accent/15 text-tactical-accent"
                  : "border-tactical-border text-tactical-muted hover:border-tactical-cyan"
              }`}
            >
              {g.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className="rounded border border-dashed border-tactical-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-tactical-muted hover:border-tactical-accent hover:text-tactical-accent"
          >
            Refresh
          </button>
        </div>
      </div>

      {data?.spike.spiking && (
        <CriticalBanner>
          <span className="font-semibold uppercase tracking-wide">
            Volume anomaly
          </span>
          <p className="mt-1 text-red-200/90">
            Last bucket exceeds recent mean (z &gt; 1.5). Correlate with live
            events, NOTAMs, and leadership travel — heuristic only.
          </p>
        </CriticalBanner>
      )}

      {err && (
        <div className="rounded border border-tactical-red bg-tactical-red/10 px-4 py-3 font-mono text-sm text-red-200">
          {err}
        </div>
      )}

      {loading && !data && (
        <p className="font-mono text-sm text-tactical-muted">Loading board…</p>
      )}

      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <Metric
              label="Tracked threads"
              value={String(data.counts.total)}
              hint="Seed corpus"
            />
            <Metric
              label="Critical"
              value={String(data.counts.tiers.critical ?? 0)}
              hint="Score 8–10"
              accent="text-tactical-red"
            />
            <Metric
              label="Elevated"
              value={String(data.counts.tiers.elevated ?? 0)}
              hint="Score 6–7"
              accent="text-tactical-amber"
            />
            <Metric
              label="Δ last bucket"
              value={
                data.spike.lastDelta >= 0
                  ? `+${data.spike.lastDelta.toFixed(1)}`
                  : data.spike.lastDelta.toFixed(1)
              }
              hint="vs prior mean"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
                Discussion volume
              </h3>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series}>
                    <defs>
                      <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3d8b9e" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3d8b9e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3238" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#7d8a92", fontSize: 10 }}
                      axisLine={{ stroke: "#2a3238" }}
                    />
                    <YAxis
                      tick={{ fill: "#7d8a92", fontSize: 10 }}
                      axisLine={{ stroke: "#2a3238" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111618",
                        border: "1px solid #2a3238",
                        fontFamily: "var(--font-share-tech)",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3d8b9e"
                      fill="url(#vol)"
                      name="Posts"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
                Risk-bearing posts in bucket
              </h3>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3238" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#7d8a92", fontSize: 10 }}
                      axisLine={{ stroke: "#2a3238" }}
                    />
                    <YAxis
                      tick={{ fill: "#7d8a92", fontSize: 10 }}
                      axisLine={{ stroke: "#2a3238" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111618",
                        border: "1px solid #2a3238",
                        fontFamily: "var(--font-share-tech)",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "var(--font-share-tech)", fontSize: 11 }}
                    />
                    <Bar dataKey="elevated" stackId="a" fill="#e8a838" name="Elevated" />
                    <Bar dataKey="critical" stackId="a" fill="#c42b2b" name="Critical" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
                Subreddit mix
              </h3>
              <ul className="mt-4 max-h-64 space-y-2 overflow-auto font-mono text-sm">
                {data.subreddits.map((s) => (
                  <li key={s.name} className="flex justify-between gap-2 text-tactical-muted">
                    <span className="text-tactical-cyan">r/{s.name}</span>
                    <span className="text-white">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
                Most active handles (volume)
              </h3>
              <ul className="mt-4 max-h-64 space-y-2 overflow-auto font-mono text-sm">
                {data.topAuthors.map((a) => (
                  <li key={a.author} className="flex justify-between gap-2 text-tactical-muted">
                    <span className="text-white">u/{a.author}</span>
                    <span>{a.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="font-mono text-[11px] leading-relaxed text-tactical-muted">
            {data.modelNote}
          </p>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-tactical-muted">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accent ?? "text-white"}`}>
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] text-tactical-muted">{hint}</p>
    </div>
  );
}
