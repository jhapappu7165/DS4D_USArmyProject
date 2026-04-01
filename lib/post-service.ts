import { SEED_POSTS } from "./seed-posts";
import { analyzeAll, isGeminiEnabled } from "./risk-engine";
import type { EnrichedPost, RedditPostInput } from "./types";

type CacheEngine = "gemini" | "heuristic";

let cached: {
  posts: EnrichedPost[];
  builtAt: number;
  engine: CacheEngine;
} | null = null;
const TTL_MS = 1000 * 60 * 30; // refresh analysis every 30 min in dev

function currentEngine(): CacheEngine {
  return isGeminiEnabled() ? "gemini" : "heuristic";
}

export async function getEnrichedCorpus(
  forceRefresh = false,
): Promise<EnrichedPost[]> {
  const now = Date.now();
  const engine = currentEngine();
  if (
    !forceRefresh &&
    cached &&
    cached.engine === engine &&
    now - cached.builtAt < TTL_MS
  ) {
    return cached.posts;
  }

  const analysisById = await analyzeAll(SEED_POSTS);
  const posts: EnrichedPost[] = SEED_POSTS.map((p) => ({
    ...p,
    analysis: analysisById.get(p.id)!,
  }));

  posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  cached = { posts, builtAt: now, engine };
  return posts;
}

/** Future: swap SEED_POSTS for Reddit ingest */
export function getRawSeeds(): RedditPostInput[] {
  return [...SEED_POSTS];
}
