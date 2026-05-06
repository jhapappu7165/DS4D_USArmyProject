import { SEED_POSTS } from "./seed-posts";
import { fetchFortHoodPosts } from "./reddit-fetcher";
import { analyzeAll, isGeminiEnabled } from "./risk-engine";
import type { EnrichedPost, RedditPostInput } from "./types";

type CacheEngine = "gemini" | "heuristic";

let cached: {
  posts: EnrichedPost[];
  builtAt: number;
  engine: CacheEngine;
} | null = null;
const TTL_MS = 1000 * 60 * 30; // 30-min TTL — Reddit fetch + re-analysis

function currentEngine(): CacheEngine {
  return isGeminiEnabled() ? "gemini" : "heuristic";
}

async function loadRawPosts(): Promise<RedditPostInput[]> {
  try {
    const posts = await fetchFortHoodPosts();
    console.log(`[reddit] fetched ${posts.length} live posts`);
    return posts;
  } catch (err) {
    console.warn("[reddit] fetch failed — falling back to seed corpus:", err);
    return SEED_POSTS;
  }
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

  const rawPosts = await loadRawPosts();
  const analysisById = await analyzeAll(rawPosts);
  const posts: EnrichedPost[] = rawPosts.map((p) => ({
    ...p,
    analysis: analysisById.get(p.id)!,
  }));

  posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  cached = { posts, builtAt: now, engine };
  return posts;
}

export function getRawSeeds(): RedditPostInput[] {
  return [...SEED_POSTS];
}
