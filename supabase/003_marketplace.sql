-- ============================================================
-- Ress Marketplace — catálogos, packs, "sobre", lista de e-mails
-- Rode DEPOIS do schema.sql e do 002_admin.sql.
-- Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- Catálogos (playlists) -------------------------------------
create table if not exists public.catalogs (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  tags         text[] not null default '{}',
  cover_url    text,
  published    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.catalogs enable row level security;

drop policy if exists "catálogos publicados são públicos" on public.catalogs;
create policy "catálogos publicados são públicos" on public.catalogs
  for select using (published);
drop policy if exists "admin gerencia catálogos" on public.catalogs;
create policy "admin gerencia catálogos" on public.catalogs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Beats: catálogo, plays, duração, download grátis ------------
alter table public.beats add column if not exists catalog_id uuid references public.catalogs on delete set null;
alter table public.beats add column if not exists plays integer not null default 0;
alter table public.beats add column if not exists duration_seconds integer;
alter table public.beats add column if not exists free_download boolean not null default false;
create index if not exists beats_catalog_idx on public.beats (catalog_id);

-- Conta uma reprodução (qualquer visitante pode chamar, só soma 1).
create or replace function public.increment_play(beat uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.beats set plays = plays + 1 where id = beat and published;
$$;
grant execute on function public.increment_play(uuid) to anon, authenticated;

-- Licenças: destaque "Mais popular" --------------------------
alter table public.licenses add column if not exists featured boolean not null default false;
update public.licenses set featured = true
  where slug = 'premium' and not exists (select 1 from public.licenses where featured);

-- Packs / Sound kits -----------------------------------------
create table if not exists public.soundkits (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  description       text,
  tags              text[] not null default '{}',
  cover_url         text,
  preview_url       text,             -- áudio de demonstração (opcional, público)
  file_path         text,             -- .zip no bucket privado
  price_cents       integer not null default 0 check (price_cents >= 0),
  compare_at_cents  integer check (compare_at_cents >= 0),  -- preço "de" (riscado)
  published         boolean not null default true,
  created_at        timestamptz not null default now()
);
alter table public.soundkits enable row level security;

drop policy if exists "packs publicados são públicos" on public.soundkits;
create policy "packs publicados são públicos" on public.soundkits
  for select using (published);
drop policy if exists "admin gerencia packs" on public.soundkits;
create policy "admin gerencia packs" on public.soundkits
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Informações do site ("Sobre") — uma linha só ----------------
create table if not exists public.site_settings (
  id                 integer primary key default 1 check (id = 1),
  brand_name         text not null default 'RESS Beats',
  hero_title         text,
  hero_subtitle      text,
  about_text         text,
  photo_url          text,
  email              text,
  whatsapp           text,
  instagram          text,
  youtube            text,
  tiktok             text,
  spotify            text,
  soundcloud         text,
  beatstars          text,
  announcement_text  text,
  announcement_url   text,
  artists            text[] not null default '{}',
  updated_at         timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;

drop policy if exists "informações do site são públicas" on public.site_settings;
create policy "informações do site são públicas" on public.site_settings
  for select using (true);
drop policy if exists "admin edita informações do site" on public.site_settings;
create policy "admin edita informações do site" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Lista de e-mails ("Join our list") -------------------------
create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at  timestamptz not null default now()
);
alter table public.subscribers enable row level security;

-- Qualquer visitante pode se inscrever, mas só o admin vê a lista.
drop policy if exists "visitante se inscreve" on public.subscribers;
create policy "visitante se inscreve" on public.subscribers
  for insert to anon, authenticated with check (char_length(email) <= 254 and char_length(coalesce(name, '')) <= 120);
drop policy if exists "admin vê inscritos" on public.subscribers;
create policy "admin vê inscritos" on public.subscribers
  for select to authenticated using (public.is_admin());
drop policy if exists "admin remove inscritos" on public.subscribers;
create policy "admin remove inscritos" on public.subscribers
  for delete to authenticated using (public.is_admin());

-- Catálogo inicial para os beats de demonstração --------------
insert into public.catalogs (slug, name, description, tags)
values ('demo', 'Demo Pack', 'Beats de demonstração — apague quando subir os seus.', '{demo}')
on conflict (slug) do nothing;
update public.beats set catalog_id = (select id from public.catalogs where slug = 'demo')
  where catalog_id is null and slug in ('noite-fria', 'vila-sonho', 'asfalto', 'mare-alta');
