import { coverGradient } from "@/lib/format";

/** Capa do beat/catálogo/pack; sem imagem, mostra um gradiente com as iniciais. */
export function Cover({
  src,
  seed,
  label,
  className = "",
}: {
  src: string | null;
  seed: string;
  label?: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />;
  }
  const initials = (label ?? seed)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`grid place-items-center overflow-hidden ${className}`}
      style={{ background: coverGradient(seed), containerType: "inline-size" }}
    >
      <span className="display font-bold text-white/70" style={{ fontSize: "clamp(0.6rem, 26cqw, 3.5rem)" }}>
        {initials}
      </span>
    </div>
  );
}
