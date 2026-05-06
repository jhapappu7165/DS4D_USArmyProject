import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RedditPostInput, RiskAnalysis } from "./types";
import { tierFromScore } from "./types";

type GeminiShape = {
  score: number;
  summary: string;
  threat_rationale: string;
  coded_language_notes: string;
};

const GEMINI_PROMPT = `You are a senior open-source intelligence (OSINT) analyst supporting U.S. Army force protection and installation security (e.g., Fort Cavazos / Fort Hood area of interest).

Analyze the Reddit post below for operational security risk, targeting indicators, aggregation value, and PERSEC/INFOSEC concerns.

CRITICAL: Do NOT rely only on obvious violent keywords. Consider:
- Coded or euphemistic language (e.g., sports terms used to mean weapons or tactics, vague meetup language that could signal coordination)
- Pattern-of-life details that could help adversaries (timelines, gates, routines, equipment movements)
- Correlation value across posts (VIP movement inference, unit rotations, comms testing)
- Whether content is likely benign community discussion vs. materially useful to a threat actor

BREVITY (for executive dashboards): write so an audience can read each field in under 5 seconds on screen.
Return ONLY valid JSON with keys:
{"score": <number 0-10>, "summary": "<ONE short sentence, max ~20 words: what this post is and headline risk>", "threat_rationale": "<ONE short sentence, max ~25 words: why the score — FP impact or why benign>", "coded_language_notes": "<one short phrase, or exactly the word \"None.\" if not applicable>"}

Scoring guide:
0-3 benign or general interest
4-5 mild sensitivity or noisy but worth monitoring
6-7 elevated: useful tactical context, weak PERSEC, or plausible coded language
8-10 critical: clear targeting/coordination indicators, severe aggregation risk, or strong coded threat semantics

POST:
`;

/** Heuristic signals — context-aware; not raw keyword matching alone */
function contextualHeuristic(post: RedditPostInput): RiskAnalysis {
  const text = `${post.title}\n${post.body}`.toLowerCase();
  let score = 2;
  const cues: string[] = [];

  const codedEuphemism =
    /\b(pigskin|big game|fireworks?|special ice|playbook|coach|parade route)\b/i.test(
      text,
    ) &&
    /\b(midnight|cash only|behind the|warehouse|security rotates|strip)\b/i.test(text);
  if (codedEuphemism) {
    score += 4;
    cues.push(
      "Cluster of euphemisms + logistics/meetup constraints suggests possible coded coordination rather than casual sports talk.",
    );
  }

  if (/\bfootball\b/i.test(text) && /\b(bomb|explosive|detonat)\b/i.test(text)) {
    score += 2;
    cues.push("Direct juxtaposition of casual terms with explosive lexicon.");
  }

  if (
    /\b(vip|motorcade|distinguished visitor|senior leader|aggregation|cross-?platform|synthetic recap)\b/i.test(
      text,
    )
  ) {
    score += 2;
    cues.push("References VIP protection calculus or multi-source aggregation.");
  }

  if (/\b(comms?|callsign|frequency|coded)\b/i.test(text) && /\b(hood|post|fort)\b/i.test(text)) {
    score += 1;
    cues.push("Communications detail tied to installation context.");
  }

  if (/\b(column|motor pool|timestamped video|equipment movement)\b/i.test(text)) {
    score += 1;
    cues.push("Observable force structure / movement detail.");
  }

  if (/\b(geotag|exif|berm|range|grid)\b/i.test(text)) {
    score += 1;
    cues.push("Geo or training infrastructure correlation.");
  }

  if (/\b(gate \d|mp\b|credential)\b/i.test(text) && score < 4) {
    score += 0;
    cues.push("Perimeter/admin detail — usually low alone.");
  }

  // Cap
  score = Math.min(10, Math.max(0, Math.round(score)));

  let codedNotes =
    cues.find((c) => c.includes("euphemism")) ??
    "No strong euphemistic cluster detected; heuristic based on FP-relevant themes.";
  if (codedEuphemism) {
    codedNotes =
      "Possible coded meetup language ('game', 'fireworks', 'playbook') combined with operational constraints — assess as coordination until disproven.";
  }

  const summary =
    score >= 8
      ? "High-risk signal — possible targeting or coordination cues."
      : score >= 6
        ? "Elevated — installation detail or aggregation angle needs analyst review."
        : score >= 4
          ? "Moderate noise — watch for clustering with other threads."
          : "Likely benign — limited force-protection relevance.";

  const threatRationale =
    cues.length > 0
      ? cues[0]!
      : "Heuristic pass: no strong FP indicators; correlate with other feeds.";

  return {
    score,
    tier: tierFromScore(score),
    summary,
    threatRationale,
    codedLanguageNotes: codedNotes,
    model: "contextual-heuristic",
  };
}

/** True when the app should call Gemini for every post (no heuristic scores). */
export function isGeminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function parseGeminiJson(raw: string): GeminiShape {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(t);
  if (fence) t = fence[1]!.trim();
  return JSON.parse(t) as GeminiShape;
}

/**
 * Requires a valid API key. Does not fall back to heuristics — failures surface as errors.
 */
async function geminiAnalyzeRequired(post: RedditPostInput): Promise<RiskAnalysis> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    // Default tracks current Gemini API stable IDs (1.5 names often 404 on v1beta now).
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const userBlock = `${GEMINI_PROMPT}subreddit: r/${post.subreddit}\nauthor: u/${post.author}\nTITLE: ${post.title}\nBODY: ${post.body}`;

  const result = await model.generateContent(userBlock);
  const raw = result.response.text();
  let parsed: GeminiShape;
  try {
    parsed = parseGeminiJson(raw);
  } catch {
    throw new Error(
      `Gemini returned non-JSON for post ${post.id}. First 200 chars: ${raw.slice(0, 200)}`,
    );
  }

  const score = Math.min(10, Math.max(0, Number(parsed.score) || 0));
  return {
    score,
    tier: tierFromScore(score),
    summary: String(parsed.summary ?? "").slice(0, 320),
    threatRationale: String(parsed.threat_rationale ?? "").slice(0, 400),
    codedLanguageNotes: String(parsed.coded_language_notes ?? "").slice(0, 280),
    model: "gemini",
  };
}

export async function analyzePost(post: RedditPostInput): Promise<RiskAnalysis> {
  if (isGeminiEnabled()) {
    return geminiAnalyzeRequired(post);
  }
  return contextualHeuristic(post);
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const part = await Promise.all(chunk.map(fn));
    results.push(...part);
  }
  return results;
}

export async function analyzeAll(posts: RedditPostInput[]): Promise<Map<string, RiskAnalysis>> {
  const analyses = await mapInBatches(posts, 5, (p) => analyzePost(p));
  const out = new Map<string, RiskAnalysis>();
  posts.forEach((p, i) => out.set(p.id, analyses[i]!));
  return out;
}
