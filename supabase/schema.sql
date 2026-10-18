-- ============================================================
-- Ress Marketplace — estrutura do banco
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- Beats ------------------------------------------------------
create table if not exists public.beats (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  bpm          integer not null check (bpm between 40 and 300),
  musical_key  text,
  genre        text not null,
  moods        text[] not null default '{}',
  tags         text[] not null default '{}',
  cover_url    text,
  preview_url  text not null,          -- MP3 com tag de voz (público)
  published    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Licenças ---------------------------------------------------
create table if not exists public.licenses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  price_cents   integer not null check (price_cents >= 0),
  files         text[] not null default '{}',   -- ex: {MP3, WAV, Stems}
  limits        text[] not null default '{}',   -- ex: {"Até 100 mil streams"}
  is_exclusive  boolean not null default false,
  sort_order    integer not null default 0
);

-- Segurança (RLS): o público só pode LER beats publicados e licenças.
-- Escrita fica restrita ao painel admin (vem numa próxima etapa).
alter table public.beats    enable row level security;
alter table public.licenses enable row level security;

drop policy if exists "beats publicados são públicos" on public.beats;
create policy "beats publicados são públicos" on public.beats
  for select using (published);

drop policy if exists "licenças são públicas" on public.licenses;
create policy "licenças são públicas" on public.licenses
  for select using (true);

-- Licenças padrão (edite preços/limites como quiser) ----------
insert into public.licenses (slug, name, description, price_cents, files, limits, is_exclusive, sort_order) values
  ('basica',    'Básica',    'Ideal para soltar um single nas plataformas.', 7900,
     '{MP3}', '{"Até 5 mil vendas/downloads","Até 100 mil streams","1 videoclipe"}', false, 1),
  ('premium',   'Premium',   'Qualidade de estúdio em WAV.', 19900,
     '{MP3,WAV}', '{"Até 50 mil vendas/downloads","Até 500 mil streams","3 videoclipes"}', false, 2),
  ('trackout',  'Trackout',  'Stems separados para mixar do seu jeito.', 39900,
     '{MP3,WAV,Stems}', '{"Até 200 mil vendas/downloads","Streams ilimitados","Videoclipes ilimitados"}', false, 3),
  ('exclusiva', 'Exclusiva', 'O beat é só seu e sai da loja.', 0,
     '{MP3,WAV,Stems}', '{"Uso ilimitado","Direitos exclusivos","Preço sob consulta"}', true, 4)
on conflict (slug) do nothing;

-- Beats de demonstração (apague quando subir os seus) ---------
insert into public.beats (slug, title, bpm, musical_key, genre, moods, tags, preview_url) values
  ('noite-fria', 'Noite Fria', 140, 'Lá menor',  'Trap',      '{Sombrio,Melancólico}', '{trap,bells,dark}',   '/demo/noite-fria.mp3'),
  ('vila-sonho', 'Vila Sonho',  90, 'Dó maior',  'Boom Bap',  '{Nostálgico,Chill}',    '{boombap,lofi,jazz}', '/demo/vila-sonho.mp3'),
  ('asfalto',    'Asfalto',    142, 'Fá# menor', 'Drill',     '{Agressivo,Sombrio}',   '{drill,uk,808}',      '/demo/asfalto.mp3'),
  ('mare-alta',  'Maré Alta',  100, 'Mi menor',  'R&B',       '{Romântico,Chill}',     '{rnb,smooth,pads}',   '/demo/mare-alta.mp3')
on conflict (slug) do nothing;
