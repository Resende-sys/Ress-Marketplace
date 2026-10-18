import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeatHero } from "@/components/beat-hero";
import { getBeat, getBeats, getLicenses } from "@/lib/catalog";

export async function generateStaticParams() {
  const beats = await getBeats();
  return beats.map((b) => ({ slug: b.slug }));
}

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
