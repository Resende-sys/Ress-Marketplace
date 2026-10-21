import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Catalog, License, Soundkit } from "@/lib/types";
import { Cover } from "./cover";
import { ArrowIcon, BoltIcon, CheckIcon, FileIcon } from "./icons";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label flex items-center gap-2 !text-accent-hi">
          <span className="h-px w-6 bg-accent" />
          {eyebrow}
        </p>
        <h2 className="display mt-3 text-4xl font-bold sm:text-5xl">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn btn-ghost">
          {action.label} <ArrowIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function CatalogCard({ catalog, count }: { catalog: Catalog; count: number }) {
  return (
    <Link href={`/catalogos/${catalog.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <Cover src={catalog.coverUrl} seed={catalog.slug} label={catalog.name} className="aspect-square w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="label !text-[0.6rem] !text-white/70">{count} {count === 1 ? "beat" : "beats"}</p>
          <p className="display mt-1 text-xl font-bold">{catalog.name}</p>
        </div>
        <span className="absolute top-3 right-3 grid size-10 translate-y-2 place-items-center rounded-full bg-accent text-white opacity-0 shadow-[0_0_20px_var(--glow)] transition group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowIcon className="size-4" />
        </span>
      </div>
      {catalog.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {catalog.tags.slice(0, 3).map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function KitCard({ kit }: { kit: Soundkit }) {
  const onSale = kit.compareAtCents != null && kit.compareAtCents > kit.priceCents;
  return (
    <Link href={`/packs/${kit.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <Cover src={kit.coverUrl} seed={kit.slug} label={kit.title} className="aspect-square w-full transition duration-500 group-hover:scale-105" />
        {onSale && (
          <span className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 font-mono text-[0.6rem] font-bold tracking-[0.18em] text-white uppercase shadow-[0_0_18px_var(--glow)]">
            Promo
          </span>
        )}
      </div>
      <p className="mt-3 font-semibold tracking-tight uppercase">{kit.title}</p>
      <p className="mt-1 flex items-baseline gap-2 font-mono text-sm">
        {onSale && <span className="text-dim line-through">{formatPrice(kit.compareAtCents!)}</span>}
        <span className="text-accent-hi">{formatPrice(kit.priceCents)}</span>
      </p>
    </Link>
  );
}

export function LicenseCards({ licenses }: { licenses: License[] }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${licenses.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {licenses.map((l) => (
        <div
          key={l.id}
          className={`panel relative flex flex-col p-6 ${l.featured ? "hud border-accent/60 shadow-[0_20px_60px_-25px_var(--glow)]" : ""}`}
        >
          {l.featured && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 font-mono text-[0.58rem] font-bold tracking-[0.2em] text-white uppercase">
              Mais popular
            </span>
          )}
          <p className="label">{l.name}</p>
          <p className="display mt-3 text-4xl font-bold">{l.isExclusive ? "Sob consulta" : formatPrice(l.priceCents)}</p>
          {!l.isExclusive && <p className="label mt-1 !text-[0.6rem]">por beat</p>}
          {l.description && <p className="mt-4 text-sm text-muted">{l.description}</p>}
          <ul className="mt-5 grid gap-2.5 border-t border-line pt-5 text-sm">
            <li className="flex items-center gap-2.5">
              <FileIcon className="size-4 shrink-0 text-accent-hi" />
              {l.files.join(" + ")}
            </li>
            {l.limits.map((lim) => (
              <li key={lim} className="flex items-center gap-2.5">
                <CheckIcon className="size-4 shrink-0 text-accent-hi" />
                {lim}
              </li>
            ))}
            <li className="flex items-center gap-2.5 text-muted">
              <BoltIcon className="size-4 shrink-0 text-accent-hi" />
              Entrega imediata
            </li>
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Faixa "Já trabalhei com" correndo de lado. */
export function ArtistsMarquee({ artists }: { artists: string[] }) {
  if (!artists.length) return null;
  return (
    <section className="border-y border-line bg-surface/60 py-8">
      <p className="label mx-auto mb-5 max-w-7xl px-4 sm:px-6">Já trabalhei com</p>
      <div className="marquee-mask overflow-hidden">
        <div className="marquee" style={{ "--marquee-speed": `${Math.max(20, artists.length * 5)}s` } as React.CSSProperties}>
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
              {artists.map((a, i) => (
                <span key={`${half}-${i}`} className="display flex items-center gap-10 pr-10 text-3xl font-bold whitespace-nowrap text-white/35 uppercase transition hover:text-white sm:text-5xl">
                  {a}
                  <span className="inline-block size-2 rotate-45 bg-accent" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
