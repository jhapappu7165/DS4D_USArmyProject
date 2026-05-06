import type { EnrichedPost, TimeGranularity } from "./types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function startOfWeekMondayUTC(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfYear(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function bucketKey(date: Date, g: TimeGranularity): string {
  switch (g) {
    case "day":
      return startOfDay(date).toISOString().slice(0, 10);
    case "week":
      return startOfWeekMondayUTC(date).toISOString().slice(0, 10);
    case "month":
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    case "year":
      return String(date.getUTCFullYear());
    default:
      return startOfDay(date).toISOString().slice(0, 10);
  }
}

export interface TimeSeriesPoint {
  label: string;
  count: number;
  critical: number;
  elevated: number;
}

export function aggregateByTime(
  posts: EnrichedPost[],
  granularity: TimeGranularity,
): TimeSeriesPoint[] {
  const map = new Map<
    string,
    { count: number; critical: number; elevated: number }
  >();

  for (const p of posts) {
    const d = new Date(p.createdAt);
    const k = bucketKey(d, granularity);
    const cur = map.get(k) ?? { count: 0, critical: 0, elevated: 0 };
    cur.count += 1;
    if (p.analysis.tier === "critical") cur.critical += 1;
    if (p.analysis.tier === "elevated") cur.elevated += 1;
    map.set(k, cur);
  }

  const labels = Array.from(map.keys()).sort();
  return labels.map((label) => {
    const v = map.get(label)!;
    return {
      label,
      count: v.count,
      critical: v.critical,
      elevated: v.elevated,
    };
  });
}

export function tierCounts(posts: EnrichedPost[]) {
  const init = { low: 0, moderate: 0, elevated: 0, critical: 0 };
  for (const p of posts) {
    init[p.analysis.tier] += 1;
  }
  return init;
}

export function subredditCounts(posts: EnrichedPost[]) {
  const m = new Map<string, number>();
  for (const p of posts) {
    m.set(p.subreddit, (m.get(p.subreddit) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function topAuthors(posts: EnrichedPost[], n = 8) {
  const m = new Map<string, number>();
  for (const p of posts) {
    m.set(p.author, (m.get(p.author) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([author, count]) => ({ author, count }));
}

/** Simple z-score spike flag on last bucket vs previous mean */
export function detectSpike(points: TimeSeriesPoint[]): {
  spiking: boolean;
  lastDelta: number;
} {
  if (points.length < 3) return { spiking: false, lastDelta: 0 };
  const counts = points.map((p) => p.count);
  const last = counts[counts.length - 1];
  const prev = counts.slice(0, -1);
  const mean = prev.reduce((a, b) => a + b, 0) / prev.length;
  const variance =
    prev.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, prev.length - 1);
  const sd = Math.sqrt(variance) || 1;
  const z = (last - mean) / sd;
  return { spiking: z > 1.5, lastDelta: last - mean };
}
