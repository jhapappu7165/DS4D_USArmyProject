/** Risk tier used for UI and alerting */
export type RiskTier = "low" | "moderate" | "elevated" | "critical";

export interface RedditPostInput {
  id: string;
  /** ISO 8601 */
  createdAt: string;
  subreddit: string;
  author: string;
  title: string;
  body: string;
  permalink: string;
  /**
   * Reddit engagement (approx. net score / upvotes from the API). Input only.
   * Force-protection risk is `EnrichedPost.analysis.score` (0–10), from Gemini/heuristic.
   */
  redditScore: number;
  numComments: number;
}

export interface RiskAnalysis {
  score: number; // 0-10
  tier: RiskTier;
  summary: string;
  threatRationale: string;
  codedLanguageNotes: string;
  model: "gemini" | "contextual-heuristic";
}

export interface EnrichedPost extends RedditPostInput {
  analysis: RiskAnalysis;
}

export type TimeGranularity = "day" | "week" | "month" | "year";

export function tierFromScore(score: number): RiskTier {
  if (score <= 3) return "low";
  if (score <= 5) return "moderate";
  if (score <= 7) return "elevated";
  return "critical";
}

export function tierLabel(t: RiskTier): string {
  switch (t) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "elevated":
      return "Elevated";
    case "critical":
      return "Critical";
    default:
      return t;
  }
}
