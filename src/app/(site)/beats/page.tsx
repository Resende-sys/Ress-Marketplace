import type { Metadata } from "next";
import { BeatBrowser, type BeatTab } from "@/components/beat-browser";
import { PageHeader } from "@/components/page-header";
import { getBeats, getLicenses } from "@/lib/catalog";
import { fromPrice } from "@/lib/pricing";

export const metadata: Metadata = { title: "Beats" };

const TABS: BeatTab[] = ["populares", "lancamentos", "todos"];

export default async function BeatsPage({ searchParams }: PageProps<"/beats">) {
  const [{ aba }, beats, licenses] = await Promise.all([searchParams, getBeats(), getLicenses()]);
  const initialTab = TABS.includes(aba as BeatTab) ? (aba as BeatTab) : "populares";

  return (
    <>
      <PageHeader eyebrow="Marketplace" title="Beats" description="Ouça, filtre por gênero, mood, tom ou BPM e licencie na hora." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <BeatBrowser beats={beats} fromPriceCents={fromPrice(licenses)} initialTab={initialTab} />
      </div>
    </>
  );
}
