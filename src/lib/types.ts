export type Beat = {
  id: string;
  slug: string;
  title: string;
  bpm: number;
  musicalKey: string | null;
  genre: string;
  moods: string[];
  tags: string[];
  coverUrl: string | null;
  previewUrl: string;
  catalogId: string | null;
  plays: number;
  durationSeconds: number | null;
  freeDownload: boolean;
  createdAt: string;
};

export type License = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  files: string[];
  limits: string[];
  isExclusive: boolean;
  featured: boolean;
};

export type Catalog = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: string[];
  coverUrl: string | null;
};

export type Soundkit = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  coverUrl: string | null;
  previewUrl: string | null;
  priceCents: number;
  compareAtCents: number | null;
};

export type SiteSettings = {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  photoUrl: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  spotify: string | null;
  soundcloud: string | null;
  beatstars: string | null;
  announcementText: string | null;
  announcementUrl: string | null;
  artists: string[];
};

/** Item do carrinho (guardado no navegador). */
export type CartItem =
  | {
      kind: "beat";
      id: string; // beatId:licenseSlug
      beatId: string;
      slug: string;
      title: string;
      coverUrl: string | null;
      licenseSlug: string;
      licenseName: string;
      files: string[];
      priceCents: number;
    }
  | {
      kind: "kit";
      id: string; // kit:kitId
      kitId: string;
      slug: string;
      title: string;
      coverUrl: string | null;
      priceCents: number;
    };
