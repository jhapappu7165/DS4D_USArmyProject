import type { TimeGranularity } from "./types";

export interface CorpusPayload {
  generatedAt: string;
  granularity: TimeGranularity;
  modelNote: string;
  counts: {
    total: number;
    tiers: Record<string, number>;
  };
  subreddits: { name: string; count: number }[];
  topAuthors: { author: string; count: number }[];
  series: {
    label: string;
    count: number;
    critical: number;
    elevated: number;
  }[];
  spike: { spiking: boolean; lastDelta: number };
  posts: import("./types").EnrichedPost[];
}

export async function fetchCorpus(
  granularity: TimeGranularity = "day",
  refresh = false,
): Promise<CorpusPayload> {
  const q = new URLSearchParams({ granularity });
  if (refresh) q.set("refresh", "1");
  const res = await fetch(`/api/corpus?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; hint?: string };
      if (body.error) detail = body.error;
      if (body.hint) detail = `${detail} — ${body.hint}`;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<CorpusPayload>;
}
