import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeatRows } from "@/components/beat-browser";
import { Cover } from "@/components/cover";
import { PlayAllButton } from "@/components/play-buttons";
import { getCatalog, getLicenses } from "@/lib/catalog";
import { fromPrice } from "@/lib/pricing";

export async function generateMetadata({ params }: PageProps<"/catalogos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCatalog(slug);
  return data ? { title: data.catalog.name } : {};
}

export default async function CatalogPage({ params }: PageProps<"/catalogos/[slug]">) {
  const { slug } = await params;
  const [data, licenses] = await Promise.all([getCatalog(slug), getLicenses()]);
  if (!data) notFound();
  const { catalog, beats } = data;
  const totalSeconds = beats.reduce((s, b) => s + (b.durationSeconds ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-16">
      <header className="relative mb-10 grid items-end gap-6 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-10">
        <div className="pointer-events-none absolute -top-20 left-0 size-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="reveal hud relative mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-30px_var(--glow)]">
          <Cover src={catalog.coverUrl} seed={catalog.slug} label={catalog.name} className="aspect-square w-full" />
        </div>
        <div className="reveal relative [animation-delay:80ms]">
          <p className="label !text-accent-hi">Catálogo · Playlist</p>
          <h1 className="display mt-3 text-5xl font-bold sm:text-7xl">{catalog.name}</h1>
          {catalog.description && <p className="mt-4 max-w-2xl text-muted">{catalog.description}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip">
              {beats.length} {beats.length === 1 ? "beat" : "beats"}
            </span>
            {totalSeconds > 0 && <span className="chip">{Math.round(totalSeconds / 60)} min</span>}
            {catalog.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <PlayAllButton beats={beats} />
          </div>
        </div>
      </header>

      {beats.length === 0 ? (
        <p className="panel py-16 text-center text-muted">Esse catálogo ainda não tem beats.</p>
      ) : (
        <BeatRows beats={beats} fromPriceCents={fromPrice(licenses)} numbered />
      )}
    </div>
  );
}
