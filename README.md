# DS4D — Open-Source Threat Pattern Detection for Force Protection

**Army-615 · Designing Solutions for Defense**

## The Problem

Military installations like Fort Hood (Fort Cavazos) face a growing challenge: adversaries, bad actors, and OPSEC violators increasingly use public social media to share sensitive information — unit movements, gate routines, personnel details, and even coded coordination language. No automated tool exists to monitor this at scale for installation force protection teams.

## The Solution

DS4D is a full-stack OSINT monitoring prototype that pulls real public Reddit posts related to Fort Hood, scores each one for force-protection risk using Google Gemini AI, and surfaces the results in a clean analyst dashboard — with a dedicated view for garrison commanders showing only elevated and critical threats.

**Why Reddit?** Reddit is one of the most active platforms where soldiers, veterans, contractors, and locals openly discuss installation-related topics. It is publicly accessible, structured (subreddits, post metadata, engagement scores), and provides a real-time feed via its free API. Reddit is the **first step toward scaling** — the same pipeline (fetch → enrich → score → display) can be extended to X/Twitter, Telegram, Facebook groups, and other open sources with minimal changes.

## Team

**Pappu Jha · Hope Houston · Kaiyah Patterson · Kevon Scales**

## How to Run (for novice users)

**You need:** Node.js installed, a free Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key to the .env file
#    Open .env and set: GEMINI_API_KEY=your_key_here

# 3. Start the app
npm run dev
```

Open your browser to `http://localhost:3000` (or `3001` if 3000 is in use).

> First load takes 30–60 seconds — Gemini is analyzing all fetched posts. After that it's cached for 30 minutes.

## Pages

| Route | What you see |
|---|---|
| `/` | Mission brief + corpus snapshot |
| `/analytics` | Volume charts, tier breakdown, subreddit breakdown |
| `/intelligence` | All Reddit threads with risk scores + Gemini analysis |
| `/command` | Garrison commander view — elevated & critical only |

## How It Works

1. App fetches ~50 real Reddit posts mentioning Fort Hood from `r/army`, `r/military`, `r/FortHood`, `r/Killeen`, and related subreddits
2. Each post is sent to Google Gemini with a force-protection OSINT prompt
3. Gemini returns a **risk score (0–10)**, tier, summary, threat rationale, and coded language notes
4. Results are cached for 30 minutes — consistent across all pages
5. If Reddit is unreachable, the app falls back to a built-in seed corpus automatically

## Risk Tiers

| Tier | Score | Meaning |
|---|---|---|
| Low | 0–3 | Benign community chatter |
| Moderate | 4–5 | Worth monitoring |
| Elevated | 6–7 | Actionable indicator — analyst review needed |
| Critical | 8–10 | Targeting or coordination signal — command notification |
