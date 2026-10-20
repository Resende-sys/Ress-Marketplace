import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeatHero } from "@/components/beat-hero";
import { getBeat, getLicenses } from "@/lib/catalog";

// Sempre busca os dados atuais do banco.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/beats/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const beat = await getBeat(slug);
  return beat ? { title: `${beat.title} (${beat.bpm} BPM)` } : {};
}

export default async function BeatPage({ params }: PageProps<"/beats/[slug]">) {
  const { slug } = await params;
  const [beat, licenses] = await Promise.all([getBeat(slug), getLicenses()]);
  if (!beat) notFound();

  return <BeatHero beat={beat} licenses={licenses} />;
}
