import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { demoBeats, demoLicenses } from "./demo-data";
import type { Beat, License } from "./types";

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type BeatRow = {
  id: string;
  slug: string;
  title: string;
  bpm: number;
  musical_key: string | null;
  genre: string;
  moods: string[];
  tags: string[];
  cover_url: string | null;
  preview_url: string;
};

type LicenseRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  files: string[];
  limits: string[];
  is_exclusive: boolean;
};

// Se o Supabase ainda não estiver configurado (ou o schema.sql não foi
// rodado), o site mostra os beats de demonstração em vez de quebrar.
export async function getBeats(): Promise<Beat[]> {
  "use cache";
  cacheLife("minutes");

  const db = supabase();
  if (!db) return demoBeats;

  const { data, error } = await db
    .from("beats")
    .select("id, slug, title, bpm, musical_key, genre, moods, tags, cover_url, preview_url")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .returns<BeatRow[]>();

  if (error) {
    console.warn("[catalog] usando beats de demonstração:", error.message);
    return demoBeats;
  }

  return data.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    bpm: b.bpm,
    musicalKey: b.musical_key,
    genre: b.genre,
    moods: b.moods,
    tags: b.tags,
    coverUrl: b.cover_url,
    previewUrl: b.preview_url,
  }));
}

export async function getLicenses(): Promise<License[]> {
  "use cache";
  cacheLife("minutes");

  const db = supabase();
  if (!db) return demoLicenses;

  const { data, error } = await db
    .from("licenses")
    .select("id, slug, name, description, price_cents, files, limits, is_exclusive")
    .order("sort_order")
    .returns<LicenseRow[]>();

  if (error) {
    console.warn("[catalog] usando licenças de demonstração:", error.message);
    return demoLicenses;
  }

  return data.map((l) => ({
    id: l.id,
    slug: l.slug,
    name: l.name,
    description: l.description,
    priceCents: l.price_cents,
    files: l.files,
    limits: l.limits,
    isExclusive: l.is_exclusive,
  }));
}

export async function getBeat(slug: string) {
  const beats = await getBeats();
  return beats.find((b) => b.slug === slug) ?? null;
}
