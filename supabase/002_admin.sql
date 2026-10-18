-- ============================================================
-- Ress Marketplace — painel admin (rode DEPOIS do schema.sql)
-- Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- Quem é admin (só você) ------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;

drop policy if exists "admin vê o próprio registro" on public.admins;
create policy "admin vê o próprio registro" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- Arquivos que o comprador recebe (ficam num bucket privado) --
alter table public.beats add column if not exists mp3_path   text;
alter table public.beats add column if not exists wav_path   text;
alter table public.beats add column if not exists stems_path text;

-- Admin pode criar/editar/apagar beats e licenças ------------
drop policy if exists "admin gerencia beats" on public.beats;
create policy "admin gerencia beats" on public.beats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin gerencia licenças" on public.licenses;
create policy "admin gerencia licenças" on public.licenses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pastas de arquivos ----------------------------------------
-- covers/previews: públicos (capa e prévia com tag de voz)
-- masters: PRIVADO (MP3/WAV limpos e stems — só sai via link de compra)
insert into storage.buckets (id, name, public) values
  ('covers',   'covers',   true),
  ('previews', 'previews', true),
  ('masters',  'masters',  false)
on conflict (id) do nothing;

drop policy if exists "admin gerencia arquivos" on storage.objects;
create policy "admin gerencia arquivos" on storage.objects
  for all to authenticated
  using      (bucket_id in ('covers', 'previews', 'masters') and public.is_admin())
  with check (bucket_id in ('covers', 'previews', 'masters') and public.is_admin());

-- Torne-se admin --------------------------------------------
-- 1) Crie seu usuário em Authentication → Users → Add user
-- 2) Troque o e-mail abaixo pelo que você usou e rode de novo
insert into public.admins (user_id)
select id from auth.users where email = 'SEU_EMAIL_AQUI'
on conflict do nothing;
