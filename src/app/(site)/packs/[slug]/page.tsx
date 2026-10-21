import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { BoltIcon, BoxIcon, CheckIcon } from "@/components/icons";
import { KitBuy } from "@/components/kit-buy";
import { KitPreviewButton } from "@/components/play-buttons";
import { getSoundkit } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/packs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const kit = await getSoundkit(slug);
  return kit ? { title: kit.title } : {};
}

export default async function PackPage({ params }: PageProps<"/packs/[slug]">) {
  const { slug } = await params;
  const kit = await getSoundkit(slug);
  if (!kit) notFound();
  const onSale = kit.compareAtCents != null && kit.compareAtCents > kit.priceCents;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-16">
      <div className="reveal hud relative overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-30px_var(--glow)]">
        <Cover src={kit.coverUrl} seed={kit.slug} label={kit.title} className="aspect-square w-full" />
      </div>

      <div className="reveal [animation-delay:80ms]">
        <p className="label !text-accent-hi">Sound kit</p>
        <h1 className="display mt-3 text-5xl font-bold uppercase sm:text-6xl">{kit.title}</h1>

        <div className="mt-6 flex items-baseline gap-3">
          {onSale && <span className="font-mono text-lg text-dim line-through">{formatPrice(kit.compareAtCents!)}</span>}
          <span className="display text-4xl font-bold text-accent-hi">{formatPrice(kit.priceCents)}</span>
          {onSale && (
            <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[0.6rem] font-bold tracking-[0.15em] text-white uppercase">
              -{Math.round((1 - kit.priceCents / kit.compareAtCents!) * 100)}%
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-2">
          {kit.previewUrl && <KitPreviewButton src={kit.previewUrl} />}
          <KitBuy kit={kit} />
        </div>

        <ul className="mt-8 grid gap-2.5 border-t border-line pt-6 text-sm">
          <li className="flex items-center gap-2.5">
            <BoxIcon className="size-4 text-accent-hi" /> Arquivo .zip com WAVs
          </li>
          <li className="flex items-center gap-2.5">
            <CheckIcon className="size-4 text-accent-hi" /> Livre de royalties para usar nas suas produções
          </li>
          <li className="flex items-center gap-2.5">
            <BoltIcon className="size-4 text-accent-hi" /> Download imediato após o pagamento
          </li>
        </ul>

        {kit.description && <p className="mt-8 whitespace-pre-line text-muted">{kit.description}</p>}
        {kit.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {kit.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
