import Link from "next/link";
import { BeatBrowser } from "@/components/beat-browser";
import { Hero } from "@/components/hero";
import { ArrowIcon } from "@/components/icons";
import { JoinList } from "@/components/join-list";
import { ArtistsMarquee, CatalogCard, KitCard, LicenseCards, SectionHeading } from "@/components/sections";
import { getBeats, getCatalogs, getLicenses, getSettings, getSoundkits } from "@/lib/catalog";
import { fromPrice } from "@/lib/pricing";

export default async function Home() {
  const [settings, beats, catalogs, licenses, kits] = await Promise.all([
    getSettings(),
    getBeats(),
    getCatalogs(),
    getLicenses(),
    getSoundkits(),
  ]);

  return (
    <>
      <Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} stats={{ beats: beats.length, catalogs: catalogs.length }} />

      <ArtistsMarquee artists={settings.artists} />

      <div className="mx-auto max-w-7xl space-y-28 px-4 pt-20 sm:px-6">
        <section id="beats" className="scroll-mt-24">
          <SectionHeading eyebrow="Marketplace" title="Beats" action={{ href: "/beats", label: "Ver todos" }} />
          <BeatBrowser beats={beats} fromPriceCents={fromPrice(licenses)} filters={false} limit={8} />
        </section>

        {catalogs.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Playlists"
              title="Catálogos"
              description="Coleções de beats por clima, estilo e fase."
              action={{ href: "/catalogos", label: "Todos os catálogos" }}
            />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {catalogs.slice(0, 4).map((c) => (
                <CatalogCard key={c.id} catalog={c} count={beats.filter((b) => b.catalogId === c.id).length} />
              ))}
            </div>
          </section>
        )}

        <section id="licencas" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Licenciamento"
            title="Escolha seu nível"
            description="Termos claros para cada fase da sua carreira. Todas com entrega imediata e contrato."
            action={{ href: "/licencas", label: "Entender as licenças" }}
          />
          <LicenseCards licenses={licenses} />
        </section>

        {kits.length > 0 && (
          <section>
            <SectionHeading eyebrow="Sound kits" title="Packs" action={{ href: "/packs", label: "Ver packs" }} />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {kits.slice(0, 4).map((k) => (
                <KitCard key={k.id} kit={k} />
              ))}
            </div>
          </section>
        )}

        <JoinList />

        <section className="flex flex-col items-center gap-5 py-6 text-center">
          <p className="label">Bora trabalhar?</p>
          <h2 className="display text-4xl font-bold sm:text-6xl">
            Beat exclusivo ou <span className="text-accent-hi">produção sob medida</span>
          </h2>
          <Link href="/contato" className="btn btn-primary !px-7 !py-4">
            Falar comigo <ArrowIcon className="size-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
