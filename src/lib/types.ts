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
};
