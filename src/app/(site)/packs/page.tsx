import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { KitCard } from "@/components/sections";
import { getSoundkits } from "@/lib/catalog";

export const metadata: Metadata = { title: "Packs" };

export default async function PacksPage() {
  const kits = await getSoundkits();
  return (
    <>
      <PageHeader eyebrow="Sound kits" title="Packs" description="One-shots de bateria e melodias em WAV, prontos para usar nas suas produções." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {kits.length === 0 ? (
          <p className="panel py-16 text-center text-muted">Os packs chegam em breve.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {kits.map((k) => (
              <KitCard key={k.id} kit={k} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
