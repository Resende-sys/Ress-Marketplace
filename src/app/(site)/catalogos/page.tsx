import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CatalogCard } from "@/components/sections";
import { getBeats, getCatalogs } from "@/lib/catalog";

export const metadata: Metadata = { title: "Catálogos" };

export default async function CatalogsPage() {
  const [catalogs, beats] = await Promise.all([getCatalogs(), getBeats()]);

  return (
    <>
      <PageHeader eyebrow="Playlists" title="Catálogos" description="Abra um catálogo e ouça todos os beats dele em sequência." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {catalogs.length === 0 ? (
          <p className="panel py-16 text-center text-muted">Nenhum catálogo ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {catalogs.map((c) => (
              <CatalogCard key={c.id} catalog={c} count={beats.filter((b) => b.catalogId === c.id).length} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
