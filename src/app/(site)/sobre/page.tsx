import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { ArrowIcon } from "@/components/icons";
import { ArtistsMarquee } from "@/components/sections";
import { SocialButtons } from "@/components/socials";
import { getBeats, getCatalogs, getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Sobre" };

export default async function AboutPage() {
  const [settings, beats, catalogs] = await Promise.all([getSettings(), getBeats(), getCatalogs()]);
  const plays = beats.reduce((s, b) => s + b.plays, 0);

  return (
    <>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="reveal hud relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-30px_var(--glow)]">
          <Cover src={settings.photoUrl} seed={settings.brandName} label={settings.brandName} className="aspect-[4/5] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5">
            <p className="label !text-white/70">Produtor</p>
            <p className="display text-3xl font-bold">{settings.brandName}</p>
          </div>
        </div>

        <div className="reveal [animation-delay:80ms]">
          <p className="label flex items-center gap-2 !text-accent-hi">
            <span className="h-px w-6 bg-accent" /> Sobre
          </p>
          <h1 className="display mt-4 text-5xl font-bold sm:text-7xl">
            Quem faz o som<span className="text-accent">.</span>
          </h1>
          <p className="mt-6 text-lg whitespace-pre-line text-muted">
            {settings.aboutText || "Em breve, a história por trás dos beats."}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              [beats.length, "beats"],
              [catalogs.length, "catálogos"],
              [plays, "plays"],
            ].map(([n, label]) => (
              <div key={label} className="panel p-4">
                <p className="display text-3xl font-bold text-accent-hi">{n}</p>
                <p className="label mt-1 !text-[0.6rem]">{label}</p>
              </div>
            ))}
          </div>

          <SocialButtons settings={settings} className="mt-8" />
          <Link href="/contato" className="btn btn-primary mt-8">
            Contato <ArrowIcon className="size-4" />
          </Link>
        </div>
      </div>

      <ArtistsMarquee artists={settings.artists} />

      {settings.artists.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <p className="label mb-5">Artistas</p>
          <div className="flex flex-wrap gap-2">
            {settings.artists.map((a) => (
              <span key={a} className="rounded-xl border border-line bg-surface px-4 py-3 font-semibold uppercase">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
