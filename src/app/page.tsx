import { BeatCatalog } from "@/components/beat-catalog";
import { getBeats, getLicenses } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export default async function Home() {
  const [beats, licenses] = await Promise.all([getBeats(), getLicenses()]);
  const prices = licenses.filter((l) => !l.isExclusive).map((l) => l.priceCents);
  const fromPrice = prices.length ? Math.min(...prices) : null;

  return (
    <>
      <section className="mb-12">
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          {site.name}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-400">{site.tagline}</p>
      </section>

      <BeatCatalog beats={beats} fromPriceCents={fromPrice} />

      <section id="licencas" className="mt-20 scroll-mt-24">
        <h2 className="text-2xl font-bold">Licenças</h2>
        <p className="mt-1 text-zinc-400">Todas com contrato em PDF e download imediato.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {licenses.map((l) => (
            <div key={l.id} className="rounded-xl border border-white/10 bg-zinc-900/50 p-5">
              <h3 className="font-semibold">{l.name}</h3>
              <p className="mt-1 text-2xl font-bold text-accent">
                {l.isExclusive ? "Sob consulta" : formatPrice(l.priceCents)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">{l.files.join(" + ")}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-zinc-300">
                {l.limits.map((lim) => (
                  <li key={lim}>✓ {lim}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
