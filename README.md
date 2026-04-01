# Designing Solutions for Defense (DS4D)

## Topic: Open-Source Threat Pattern Detection for Force Protection (Army-615)

### OSINT Threat Monitor (prototype)

Full-stack **Next.js 14** app: dark “analyst console” UI, seeded Reddit-style corpus (replace with Reddit API later), contextual risk scoring **0–10** with four tiers (low / moderate / elevated / critical), **Google Gemini** analysis for euphemistic and coded language, and a **garrison commander** view that only surfaces elevated + critical threads with summary and threat rationale.

#### Quick start

```bash
npm install
cp .env.example .env.local  
npm run dev
```

Open `http://localhost:3000`.

| Route | Purpose |
|--------|--------|
| `/` | Mission brief + corpus snapshot |
| `/analytics` | Volume / tier charts, subreddit & author breakdown, spike hint |
| `/intelligence` | All threads, filters, expandable detail |
| `/command` | Leadership: elevated & critical only |
| `GET /api/corpus?granularity=day\|week\|month\|year` | JSON for charts + enriched posts |

#### Risk engine

- If **`GEMINI_API_KEY`** is set (e.g. in `.env` or `.env.local`), **every post** is scored and written up **only by Gemini** — there is **no** heuristic fallback for those runs (API errors return `502` from `/api/corpus` so you know the model failed).
- If the key is **unset**, the app uses the **contextual heuristic** in `lib/risk-engine.ts` only.

#### Where input and output live

| | Location |
|---|----------|
| **Input (hardcoded Reddit-shaped posts)** | `lib/seed-posts.ts` — edit this to change what gets analyzed. |
| **Output (risk score, tier, summary, rationale, coded-language notes)** | **Not saved as files.** Produced at runtime in `lib/risk-engine.ts`, merged with seeds in `lib/post-service.ts`, cached in memory ~30 minutes (use refresh to rerun). |

`seed-posts.ts` includes **`redditScore`** (and comment counts): those mimic **Reddit’s** post metrics, not your FP model. The **0–10 risk score** is always `post.analysis.score` after enrichment.


#### How analysis runs (“trigger execution”)

1. Start the app: `npm run dev` (or `npm run start` after `npm run build`).
2. Open any page (`/`, `/analytics`, `/intelligence`, `/command`) or call the API — the **first request** after cache expiry kicks off analysis (with Gemini: **one API call per seed post**, batched five at a time, so the first load can take a while).
3. **Force a full re-analysis** now: open or `curl`  
   `http://localhost:3000/api/corpus?refresh=1`  
   (add `&granularity=week` etc. as needed).
