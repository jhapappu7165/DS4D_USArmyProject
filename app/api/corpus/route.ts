import { NextResponse } from "next/server";
import {
  aggregateByTime,
  detectSpike,
  subredditCounts,
  tierCounts,
  topAuthors,
} from "@/lib/chart-aggregates";
import { getEnrichedCorpus } from "@/lib/post-service";
import { isGeminiEnabled } from "@/lib/risk-engine";
import type { TimeGranularity } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseGranularity(v: string | null): TimeGranularity {
  if (v === "week" || v === "month" || v === "year") return v;
  return "day";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "1";
  const g = parseGranularity(searchParams.get("granularity"));

  let posts;
  try {
    posts = await getEnrichedCorpus(refresh);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json(
      {
        error: message,
        hint: isGeminiEnabled()
          ? "Check GEMINI_API_KEY, quota, and network. Set GEMINI_MODEL to a model your key supports (e.g. gemini-2.5-flash)."
          : "Set GEMINI_API_KEY to use Gemini, or remove it to use the offline heuristic.",
      },
      { status: 502 },
    );
  }

  const series = aggregateByTime(posts, g);
  const spike = detectSpike(series);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    granularity: g,
    modelNote: isGeminiEnabled()
      ? `Risk scores and narratives from Gemini (${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}).`
      : "GEMINI_API_KEY unset — using contextual heuristic engine only.",
    counts: {
      total: posts.length,
      tiers: tierCounts(posts),
    },
    subreddits: subredditCounts(posts),
    topAuthors: topAuthors(posts),
    series,
    spike,
    posts,
  });
}
