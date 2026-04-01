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
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
          Open-Source Threat Pattern{" "}
          <span className="text-tactical-accent">Detection</span>
        </h2>
        <p className="max-w-2xl text-lg leading-relaxed text-tactical-muted">
          This workstation ingests public Reddit discourse tied to the U.S. Army
          and the Fort Cavazos / Killeen area of interest (AOI). Analysts review
          volume trends, thread-level content, and contextual risk scoring —
          including euphemistic / coded language — before leadership sees only
          what requires action.
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
            className="rounded border border-tactical-border px-4 py-2 font-display text-sm uppercase tracking-wide text-tactical-muted transition hover:border-tactical-red hover:text-red-300"
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
          <p className="mt-2 font-display text-3xl font-semibold text-white">
            {posts.length}{" "}
            <span className="text-base font-normal text-tactical-muted">
              tracked threads (seed)
            </span>
          </p>
          <p className="mt-2 font-mono text-xs text-tactical-muted">
            Replace seed file with Reddit API pull when credentials are
            authorized.
          </p>
        </div>
        <div className="panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-tactical-muted">
            Tier distribution
          </h3>
          <ul className="mt-3 space-y-2 font-mono text-sm">
            {(
              [
                ["critical", tiers.critical],
                ["elevated", tiers.elevated],
                ["moderate", tiers.moderate],
                ["low", tiers.low],
              ] as const
            ).map(([k, n]) => (
              <li key={k} className="flex justify-between gap-4 border-b border-white/5 pb-2">
                <span className="uppercase tracking-wider text-tactical-muted">
                  {k}
                </span>
                <span className="text-white">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-tactical-cyan">
          Mission alignment
        </h3>
        <ul className="mt-4 list-inside list-disc space-y-2 text-tactical-muted">
          <li>
            Surfaces spikes in discussion volume that may precede
            high-visibility events or targeting chatter.
          </li>
          <li>
            Preserves thread provenance: subreddit, handle, timestamp, body,
            and model rationale for each risk call.
          </li>
          <li>
            Uses LLM assessment (Google Gemini when{" "}
            <code className="font-mono text-tactical-accent">GEMINI_API_KEY</code>{" "}
            is set) with a contextual fallback that treats clusters of benign
            words as suspicious when the operational framing fits.
          </li>
          <li>
            Command view strips noise: only elevated / critical items with
            executive summary and &ldquo;why it matters.&rdquo;
          </li>
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
                <p className="mt-2 font-display text-white">{p.title}</p>
                <p className="mt-1 line-clamp-2 font-mono text-xs text-tactical-muted">
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
