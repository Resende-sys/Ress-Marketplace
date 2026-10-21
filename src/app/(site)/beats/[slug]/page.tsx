import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeatRows } from "@/components/beat-browser";
import { Cover } from "@/components/cover";
import { LicensePanel } from "@/components/license-picker";
import { BeatPlayButton } from "@/components/play-buttons";
import { contactHref } from "@/components/socials";
import { getBeat, getBeats, getCatalogs, getLicenses, getSettings } from "@/lib/catalog";
import { formatPlays, formatTime } from "@/lib/format";
import { fromPrice } from "@/lib/pricing";

export async function generateMetadata({ params }: PageProps<"/beats/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const beat = await getBeat(slug);
  return beat ? { title: `${beat.title} (${beat.bpm} BPM)` } : {};
}

export default async function BeatPage({ params }: PageProps<"/beats/[slug]">) {
  const { slug } = await params;
  const [beat, beats, catalogs, licenses, settings] = await Promise.all([
    getBeat(slug),
    getBeats(),
    getCatalogs(),
    getLicenses(),
    getSettings(),
  ]);
  if (!beat) notFound();

  const catalog = catalogs.find((c) => c.id === beat.catalogId);
  const related = beats.filter((b) => b.id !== beat.id && (catalog ? b.catalogId === catalog.id : b.genre === beat.genre)).slice(0, 5);

  const meta = [
    ["BPM", String(beat.bpm)],
    ["Tom", beat.musicalKey ?? "—"],
    ["Duração", formatTime(beat.durationSeconds)],
    ["Plays", formatPlays(beat.plays)],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-16">
      <div className="grid gap-8 lg:grid-cols-[380px_1fr] lg:gap-12">
        <div className="reveal">
          <div className="hud relative overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-30px_var(--glow)]">
            <Cover src={beat.coverUrl} seed={beat.slug} label={beat.title} className="aspect-square w-full" />
          </div>
          <div className="mt-4">
            <BeatPlayButton beat={beat} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {meta.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-surface p-3 text-center">
                <p className="label !text-[0.55rem]">{k}</p>
                <p className="mt-1 truncate font-mono text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal [animation-delay:80ms]">
          <p className="label !text-accent-hi">
            {beat.genre}
            {catalog && (
              <>
                {" · "}
                <Link href={`/catalogos/${catalog.slug}`} className="underline-offset-4 hover:underline">
                  {catalog.name}
                </Link>
              </>
            )}
          </p>
          <h1 className="display mt-3 text-5xl font-bold uppercase sm:text-7xl">{beat.title}</h1>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {[...beat.moods, ...beat.tags.map((t) => `#${t}`)].map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>

          <div className="panel mt-8 p-5 sm:p-7">
            <p className="label mb-4">Escolha a licença</p>
            <LicensePanel beat={beat} licenses={licenses} contactHref={contactHref(settings)} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <p className="label mb-4">{catalog ? `Mais de ${catalog.name}` : "Você também pode curtir"}</p>
          <BeatRows beats={related} fromPriceCents={fromPrice(licenses)} />
        </section>
      )}
    </div>
  );
}
