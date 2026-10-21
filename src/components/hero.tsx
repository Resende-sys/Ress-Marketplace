import Link from "next/link";
import { ArrowIcon, BoltIcon, PixIcon } from "./icons";

// Alturas fixas (determinísticas) para a "onda sonora" decorativa.
const BARS = Array.from({ length: 64 }, (_, i) => {
  const v = Math.abs(Math.sin(i * 0.55) * 0.6 + Math.sin(i * 1.7) * 0.3 + Math.sin(i * 0.13) * 0.4);
  return Math.round(18 + v * 70);
});

export function Hero({
  title,
  subtitle,
  stats,
}: {
  title: string;
  subtitle: string;
  stats: { beats: number; catalogs: number };
}) {
  return (
    <section className="scanline relative overflow-hidden">
      <div className="mx-auto flex min-h-[78svh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <p className="reveal label flex items-center gap-3 !text-accent-hi">
          <span className="h-px w-8 bg-accent" /> Beat store oficial <span className="h-px w-8 bg-accent" />
        </p>
        <h1 className="reveal display mt-6 max-w-5xl text-[clamp(3rem,11vw,8.5rem)] font-bold [animation-delay:80ms]">
          <span className="grad-text">{title}</span>
          <span className="text-accent drop-shadow-[0_0_30px_var(--glow)]">.</span>
        </h1>
        <p className="reveal mt-6 max-w-xl text-lg text-muted [animation-delay:160ms]">{subtitle}</p>

        <div className="reveal mt-9 flex flex-wrap justify-center gap-3 [animation-delay:240ms]">
          <Link href="/beats" className="btn btn-primary !px-7 !py-4">
            Explorar beats <ArrowIcon className="size-4" />
          </Link>
          <Link href="/catalogos" className="btn btn-ghost !px-7 !py-4">
            Catálogos
          </Link>
        </div>

        <div className="reveal mt-10 flex flex-wrap justify-center gap-2 [animation-delay:320ms]">
          <span className="chip !py-1.5">
            <span className="mr-1.5 text-accent-hi">{stats.beats}</span> beats
          </span>
          <span className="chip !py-1.5">
            <span className="mr-1.5 text-accent-hi">{stats.catalogs}</span> catálogos
          </span>
          <span className="chip !py-1.5">
            <PixIcon className="mr-1.5 size-3 text-accent-hi" /> Pix em reais
          </span>
          <span className="chip !py-1.5">
            <BoltIcon className="mr-1.5 size-3 text-accent-hi" /> Entrega imediata
          </span>
        </div>
      </div>

      {/* Onda sonora decorativa */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center gap-[3px] px-4 opacity-60 [mask-image:linear-gradient(90deg,transparent,#000_20%,#000_80%,transparent)]" aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-accent/80 to-accent-hi/10 sm:w-1"
            style={{
              height: `${h}%`,
              transformOrigin: "bottom",
              animation: `wave ${1.6 + (i % 7) * 0.18}s ease-in-out ${-(i % 9) * 0.25}s infinite`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
