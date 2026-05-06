import type { RedditPostInput } from "./types";

const SUBREDDITS = "army+military+Veterans+FortHood+Killeen+texas+OSINT+CredibleDefense+Militaryfaq";
const SEARCH_QUERY = "fort hood";
const USER_AGENT = "DS4D/1.0 (force-protection OSINT research)";
const FETCH_LIMIT = 50;

interface RedditChildData {
  id: string;
  created_utc: number;
  subreddit: string;
  author: string;
  title: string;
  selftext: string;
  permalink: string;
  score: number;
  num_comments: number;
}

interface RedditResponse {
  data: { children: { data: RedditChildData }[] };
}

function mapToPostInput(d: RedditChildData): RedditPostInput {
  return {
    id: `reddit_${d.id}`,
    createdAt: new Date(d.created_utc * 1000).toISOString(),
    subreddit: d.subreddit,
    author: d.author,
    title: d.title,
    body: d.selftext || "",
    permalink: d.permalink,
    redditScore: d.score,
    numComments: d.num_comments,
  };
}

export async function fetchFortHoodPosts(): Promise<RedditPostInput[]> {
  const url =
    `https://www.reddit.com/r/${SUBREDDITS}/search.json` +
    `?q=${encodeURIComponent(SEARCH_QUERY)}&restrict_sr=1&sort=new&limit=${FETCH_LIMIT}&t=month`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Reddit API returned HTTP ${res.status}`);
  }

  const json = (await res.json()) as RedditResponse;

  const posts = json.data.children
    .map((c) => mapToPostInput(c.data))
    .filter(
      (p) =>
        p.author !== "[deleted]" &&
        p.title !== "[deleted]" &&
        p.body !== "[deleted]" &&
        p.body !== "[removed]",
    );

  if (posts.length < 5) {
    throw new Error(`Reddit returned only ${posts.length} usable posts — possible rate limit`);
  }

  return posts;
}
