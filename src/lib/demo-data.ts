import type { Beat, License } from "./types";

// Mesmo conteúdo que o supabase/schema.sql insere como exemplo.
export const demoBeats: Beat[] = [
  { id: "demo-1", slug: "noite-fria", title: "Noite Fria", bpm: 140, musicalKey: "Lá menor", genre: "Trap", moods: ["Sombrio", "Melancólico"], tags: ["trap", "bells", "dark"], coverUrl: null, previewUrl: "/demo/noite-fria.mp3" },
  { id: "demo-2", slug: "vila-sonho", title: "Vila Sonho", bpm: 90, musicalKey: "Dó maior", genre: "Boom Bap", moods: ["Nostálgico", "Chill"], tags: ["boombap", "lofi", "jazz"], coverUrl: null, previewUrl: "/demo/vila-sonho.mp3" },
  { id: "demo-3", slug: "asfalto", title: "Asfalto", bpm: 142, musicalKey: "Fá# menor", genre: "Drill", moods: ["Agressivo", "Sombrio"], tags: ["drill", "uk", "808"], coverUrl: null, previewUrl: "/demo/asfalto.mp3" },
  { id: "demo-4", slug: "mare-alta", title: "Maré Alta", bpm: 100, musicalKey: "Mi menor", genre: "R&B", moods: ["Romântico", "Chill"], tags: ["rnb", "smooth", "pads"], coverUrl: null, previewUrl: "/demo/mare-alta.mp3" },
];

export const demoLicenses: License[] = [
  { id: "lic-1", slug: "basica", name: "Básica", description: "Ideal para soltar um single nas plataformas.", priceCents: 7900, files: ["MP3"], limits: ["Até 5 mil vendas/downloads", "Até 100 mil streams", "1 videoclipe"], isExclusive: false },
  { id: "lic-2", slug: "premium", name: "Premium", description: "Qualidade de estúdio em WAV.", priceCents: 19900, files: ["MP3", "WAV"], limits: ["Até 50 mil vendas/downloads", "Até 500 mil streams", "3 videoclipes"], isExclusive: false },
  { id: "lic-3", slug: "trackout", name: "Trackout", description: "Stems separados para mixar do seu jeito.", priceCents: 39900, files: ["MP3", "WAV", "Stems"], limits: ["Até 200 mil vendas/downloads", "Streams ilimitados", "Videoclipes ilimitados"], isExclusive: false },
  { id: "lic-4", slug: "exclusiva", name: "Exclusiva", description: "O beat é só seu e sai da loja.", priceCents: 0, files: ["MP3", "WAV", "Stems"], limits: ["Uso ilimitado", "Direitos exclusivos", "Preço sob consulta"], isExclusive: true },
];
