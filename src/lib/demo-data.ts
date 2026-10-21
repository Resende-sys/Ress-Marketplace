import type { Beat, Catalog, License, SiteSettings } from "./types";

// Conteúdo usado enquanto o banco não está configurado (ou numa falha dele).

const demoCatalogId = "demo-catalog";

function demoBeat(n: number, slug: string, title: string, bpm: number, key: string, genre: string, moods: string[], tags: string[]): Beat {
  return {
    id: `demo-${n}`,
    slug,
    title,
    bpm,
    musicalKey: key,
    genre,
    moods,
    tags,
    coverUrl: null,
    previewUrl: `/demo/${slug}.mp3`,
    catalogId: demoCatalogId,
    plays: 0,
    durationSeconds: null,
    freeDownload: false,
    createdAt: `2026-01-0${n}T00:00:00Z`,
  };
}

export const demoBeats: Beat[] = [
  demoBeat(4, "mare-alta", "Maré Alta", 100, "Mi menor", "R&B", ["Romântico", "Chill"], ["rnb", "smooth", "pads"]),
  demoBeat(3, "asfalto", "Asfalto", 142, "Fá# menor", "Drill", ["Agressivo", "Sombrio"], ["drill", "uk", "808"]),
  demoBeat(2, "vila-sonho", "Vila Sonho", 90, "Dó maior", "Boom Bap", ["Nostálgico", "Chill"], ["boombap", "lofi", "jazz"]),
  demoBeat(1, "noite-fria", "Noite Fria", 140, "Lá menor", "Trap", ["Sombrio", "Melancólico"], ["trap", "bells", "dark"]),
];

export const demoCatalogs: Catalog[] = [
  { id: demoCatalogId, slug: "demo", name: "Demo Pack", description: "Beats de demonstração.", tags: ["demo"], coverUrl: null },
];

export const demoLicenses: License[] = [
  { id: "lic-1", slug: "basica", name: "Básica", description: "Ideal para soltar um single nas plataformas.", priceCents: 7900, files: ["MP3"], limits: ["Até 5 mil vendas/downloads", "Até 100 mil streams", "1 videoclipe"], isExclusive: false, featured: false },
  { id: "lic-2", slug: "premium", name: "Premium", description: "Qualidade de estúdio em WAV.", priceCents: 19900, files: ["MP3", "WAV"], limits: ["Até 50 mil vendas/downloads", "Até 500 mil streams", "3 videoclipes"], isExclusive: false, featured: true },
  { id: "lic-3", slug: "trackout", name: "Trackout", description: "Stems separados para mixar do seu jeito.", priceCents: 39900, files: ["MP3", "WAV", "Stems"], limits: ["Até 200 mil vendas/downloads", "Streams ilimitados", "Videoclipes ilimitados"], isExclusive: false, featured: false },
  { id: "lic-4", slug: "exclusiva", name: "Exclusiva", description: "O beat é só seu e sai da loja.", priceCents: 0, files: ["MP3", "WAV", "Stems"], limits: ["Uso ilimitado", "Direitos exclusivos", "Preço sob consulta"], isExclusive: true, featured: false },
];

export const defaultSettings: SiteSettings = {
  brandName: "RESS Beats",
  heroTitle: "Som que move.",
  heroSubtitle: "Beats originais com licença na hora. Pix ou cartão, em reais.",
  aboutText: "",
  photoUrl: null,
  email: null,
  whatsapp: null,
  instagram: null,
  youtube: null,
  tiktok: null,
  spotify: null,
  soundcloud: null,
  beatstars: null,
  announcementText: null,
  announcementUrl: null,
  artists: [],
};
