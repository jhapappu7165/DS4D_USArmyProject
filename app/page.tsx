import Link from "next/link";
import { tierCounts } from "@/lib/chart-aggregates";
import { getEnrichedCorpus } from "@/lib/post-service";
import { RiskBadge } from "@/components/RiskBadge";

export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const posts = await getEnrichedCorpus();
  const tiers = tierCounts(posts);
  const critical = posts.filter((p) => p.analysis.tier === "critical");

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-4 border-b border-tactical-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-tactical-muted">
          Army-615 · Designing Solutions for Defense
        </p>
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-tactical-black sm:text-5xl">
          Open-Source Threat Pattern{" "}
          <span className="text-tactical-accent">Detection</span>
        </h2>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-800">
          Demo workstation: public Reddit threads for the Fort Cavazos / Killeen
          AOI, scored for force-protection risk (including coded language). Volume,
          intel records, and a short commander view — nothing extra on screen.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/analytics"
            className="rounded border border-tactical-accent bg-tactical-accent/10 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide text-tactical-accent transition hover:bg-tactical-accent/20"
          >
            Open operations board
          </Link>
          <Link
            href="/command"
            className="rounded border border-tactical-border px-4 py-2 font-display text-sm uppercase tracking-wide text-tactical-muted transition hover:border-tactical-red hover:text-red-700"
          >
            Garrison commander view
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
            Corpus snapshot
          </h3>
          <p className="mt-2 font-display text-3xl font-semibold text-tactical-black">
            {posts.length}{" "}
            <span className="text-base font-normal text-tactical-muted">
              tracked threads (seed)
            </span>
          </p>
          <p className="mt-2 text-sm text-tactical-muted">
            Swap seed for a live API pull when authorized.
          </p>
        </div>
        <div className="panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
            Tier distribution
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {(
              [
                ["critical", tiers.critical],
                ["elevated", tiers.elevated],
                ["moderate", tiers.moderate],
                ["low", tiers.low],
              ] as const
            ).map(([k, n]) => (
              <li key={k} className="flex justify-between gap-4 border-b border-slate-200 pb-2">
                <span className="font-medium uppercase tracking-wider text-tactical-muted">
                  {k}
                </span>
                <span className="font-display text-lg font-semibold text-tactical-black">
                  {n}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-tactical-cyan">
          Mission alignment
        </h3>
        <ul className="mt-4 list-inside list-disc space-y-3 text-base leading-snug text-slate-800">
          <li>Flags volume spikes that can track with events or hostile chatter.</li>
          <li>
            Keeps provenance per thread: subreddit, user, time, body, model, and
            score rationale.
          </li>
          <li>
            Risk text from Gemini when{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-sm text-tactical-accent">
              GEMINI_API_KEY
            </code>{" "}
            is set; otherwise a contextual heuristic (not raw keyword matching).
          </li>
          <li>Command view: only elevated / critical rows, plain-language blurbs.</li>
        </ul>
      </section>

      {critical.length > 0 && (
        <section>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-tactical-red">
            Active critical signals (preview)
          </h3>
          <div className="space-y-3">
            {critical.slice(0, 3).map((p) => (
              <div key={p.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge tier="critical" score={p.analysis.score} />
                  <span className="font-mono text-xs text-tactical-muted">
                    r/{p.subreddit} · u/{p.author}
                  </span>
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-tactical-black">
                  {p.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-700">
                  {p.analysis.summary}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
