import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { defaultSettings, demoBeats, demoCatalogs, demoLicenses } from "./demo-data";
import type { Beat, Catalog, License, SiteSettings, Soundkit } from "./types";

// Leitura pública do banco (respeita as regras RLS: só o que está publicado).
// Se o Supabase não estiver configurado ou falhar, o site mostra conteúdo de
// demonstração em vez de quebrar. `cache` evita consultas repetidas num acesso.

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

async function query<T>(label: string, fallback: T, run: (db: NonNullable<ReturnType<typeof supabase>>) => PromiseLike<{ data: unknown; error: { message: string } | null }>, map: (data: unknown) => T): Promise<T> {
  const db = supabase();
  if (!db) return fallback;
  const { data, error } = await run(db);
  if (error) {
    console.warn(`[catalog] ${label}: usando conteúdo padrão —`, error.message);
    return fallback;
  }
  return map(data);
}

function toBeat(b: Row): Beat {
  return {
    id: b.id as string,
    slug: b.slug as string,
    title: b.title as string,
    bpm: b.bpm as number,
    musicalKey: str(b.musical_key),
    genre: b.genre as string,
    moods: arr(b.moods),
    tags: arr(b.tags),
    coverUrl: str(b.cover_url),
    previewUrl: b.preview_url as string,
    catalogId: str(b.catalog_id),
    plays: (b.plays as number) ?? 0,
    durationSeconds: (b.duration_seconds as number) ?? null,
    freeDownload: Boolean(b.free_download),
    createdAt: b.created_at as string,
  };
}

function toCatalog(c: Row): Catalog {
  return {
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    description: str(c.description),
    tags: arr(c.tags),
    coverUrl: str(c.cover_url),
  };
}

function toKit(k: Row): Soundkit {
  return {
    id: k.id as string,
    slug: k.slug as string,
    title: k.title as string,
    description: str(k.description),
    tags: arr(k.tags),
    coverUrl: str(k.cover_url),
    previewUrl: str(k.preview_url),
    priceCents: k.price_cents as number,
    compareAtCents: (k.compare_at_cents as number) ?? null,
  };
}

/** Todos os beats publicados, do mais novo para o mais antigo. */
export const getBeats = cache(() =>
  query(
    "beats",
    demoBeats,
    (db) =>
      db.from("beats").select("*").eq("published", true).order("created_at", { ascending: false }),
    (data) => (data as Row[]).map(toBeat),
  ),
);

export async function getBeat(slug: string) {
  return (await getBeats()).find((b) => b.slug === slug) ?? null;
}

/** Mais tocados primeiro; empate fica com o mais novo. */
export function byPopularity(beats: Beat[]) {
  return [...beats].sort((a, b) => b.plays - a.plays || b.createdAt.localeCompare(a.createdAt));
}

export const getLicenses = cache(() =>
  query(
    "licenses",
    demoLicenses,
    (db) => db.from("licenses").select("*").order("sort_order"),
    (data) =>
      (data as Row[]).map((l) => ({
        id: l.id as string,
        slug: l.slug as string,
        name: l.name as string,
        description: str(l.description),
        priceCents: l.price_cents as number,
        files: arr(l.files),
        limits: arr(l.limits),
        isExclusive: Boolean(l.is_exclusive),
        featured: Boolean(l.featured),
      })) satisfies License[],
  ),
);

export const getCatalogs = cache(() =>
  query(
    "catalogs",
    demoCatalogs,
    (db) =>
      db.from("catalogs").select("*").eq("published", true).order("sort_order").order("created_at", { ascending: false }),
    (data) => (data as Row[]).map(toCatalog),
  ),
);

export async function getCatalog(slug: string) {
  const [catalogs, beats] = await Promise.all([getCatalogs(), getBeats()]);
  const catalog = catalogs.find((c) => c.slug === slug);
  if (!catalog) return null;
  return { catalog, beats: beats.filter((b) => b.catalogId === catalog.id) };
}

export const getSoundkits = cache(() =>
  query(
    "soundkits",
    [] as Soundkit[],
    (db) => db.from("soundkits").select("*").eq("published", true).order("created_at", { ascending: false }),
    (data) => (data as Row[]).map(toKit),
  ),
);

export async function getSoundkit(slug: string) {
  return (await getSoundkits()).find((k) => k.slug === slug) ?? null;
}

export const getSettings = cache(() =>
  query(
    "site_settings",
    defaultSettings,
    (db) => db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    (data) => {
      const s = (data ?? {}) as Row;
      return {
        brandName: str(s.brand_name) ?? defaultSettings.brandName,
        heroTitle: str(s.hero_title) ?? defaultSettings.heroTitle,
        heroSubtitle: str(s.hero_subtitle) ?? defaultSettings.heroSubtitle,
        aboutText: str(s.about_text) ?? "",
        photoUrl: str(s.photo_url),
        email: str(s.email),
        whatsapp: str(s.whatsapp),
        instagram: str(s.instagram),
        youtube: str(s.youtube),
        tiktok: str(s.tiktok),
        spotify: str(s.spotify),
        soundcloud: str(s.soundcloud),
        beatstars: str(s.beatstars),
        announcementText: str(s.announcement_text),
        announcementUrl: str(s.announcement_url),
        artists: arr(s.artists),
      } satisfies SiteSettings;
    },
  ),
);
