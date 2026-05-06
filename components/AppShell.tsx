import Link from "next/link";

const nav = [
  { href: "/", label: "BRIEF", sub: "Mission overview" },
  { href: "/analytics", label: "OPERATIONS", sub: "Volume & spikes" },
  { href: "/intelligence", label: "INTEL", sub: "Thread records" },
  { href: "/command", label: "COMMAND", sub: "Garrison — high risk" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-tactical-border bg-slate-50 px-4 py-6 lg:block">
        <div className="mb-8 px-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-tactical-muted">
            DS4D // Army-615
          </p>
          <h1 className="mt-2 font-display text-xl font-semibold uppercase tracking-wide text-tactical-accent glow-amber">
            OSINT Watch
          </h1>
          <p className="mt-1 font-mono text-xs text-tactical-muted">
            Fort Cavazos AOI · Reddit corpus (demo)
          </p>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block rounded-md border border-transparent px-3 py-3 transition hover:border-tactical-border hover:bg-white"
            >
              <span className="font-display text-sm font-semibold uppercase tracking-wide text-tactical-cyan group-hover:text-tactical-accent">
                {item.label}
              </span>
              <span className="mt-0.5 block font-mono text-[11px] text-tactical-muted">
                {item.sub}
              </span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 rounded border border-dashed border-tactical-border/60 p-3 font-mono text-[10px] leading-relaxed text-tactical-muted">
          UNCLASSIFIED // DEMO STANDALONE
          <br />
          No live Reddit ingest. Replace seed with API feed.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-tactical-border bg-white/95 backdrop-blur-md lg:hidden">
          <div className="flex flex-wrap gap-2 px-3 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded border border-tactical-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-tactical-muted hover:border-tactical-accent hover:text-tactical-accent"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
