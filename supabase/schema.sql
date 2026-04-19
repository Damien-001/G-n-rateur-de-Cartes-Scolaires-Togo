-- ============================================================
-- Générateur de Cartes Scolaires Togo — Supabase Schema
-- Exécuter dans : Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. TABLE school_info
create table if not exists public.school_info (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null default 'ÉCOLE NATIONALE DU TOGO',
  logo_url      text,
  signature_url text,
  card_colors   jsonb default '{"headerBg":"#047857","headerText":"#ffffff","footerBar":"#059669","matriculeText":"#065f46"}'::jsonb,
  updated_at    timestamptz default now(),
  unique(user_id)
);

-- 2. TABLE students
create table if not exists public.students (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  first_name   text not null default '',
  last_name    text not null default '',
  matricule    text not null default '',
  class_name   text not null default '',
  school_year  text not null default '',
  birth_date   text,
  birth_place  text,
  exam_center  text,
  photo_url    text,
  qr_code_data text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 3. Index
create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists school_info_user_id_idx on public.school_info(user_id);

-- 4. Row Level Security
alter table public.school_info enable row level security;
alter table public.students enable row level security;

-- Policies school_info
drop policy if exists "Users can view own school_info" on public.school_info;
drop policy if exists "Users can insert own school_info" on public.school_info;
drop policy if exists "Users can update own school_info" on public.school_info;

create policy "Users can view own school_info"
  on public.school_info for select using (auth.uid() = user_id);
create policy "Users can insert own school_info"
  on public.school_info for insert with check (auth.uid() = user_id);
create policy "Users can update own school_info"
  on public.school_info for update using (auth.uid() = user_id);

-- Policies students
drop policy if exists "Users can view own students" on public.students;
drop policy if exists "Users can insert own students" on public.students;
drop policy if exists "Users can update own students" on public.students;
drop policy if exists "Users can delete own students" on public.students;

create policy "Users can view own students"
  on public.students for select using (auth.uid() = user_id);
create policy "Users can insert own students"
  on public.students for insert with check (auth.uid() = user_id);
create policy "Users can update own students"
  on public.students for update using (auth.uid() = user_id);
create policy "Users can delete own students"
  on public.students for delete using (auth.uid() = user_id);

-- 5. Storage bucket (si pas encore créé)
insert into storage.buckets (id, name, public)
values ('school-assets', 'school-assets', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own assets" on storage.objects;
drop policy if exists "Users can update own assets" on storage.objects;
drop policy if exists "Users can delete own assets" on storage.objects;
drop policy if exists "Public can view assets" on storage.objects;

create policy "Users can upload own assets"
  on storage.objects for insert
  with check (bucket_id = 'school-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own assets"
  on storage.objects for update
  using (bucket_id = 'school-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own assets"
  on storage.objects for delete
  using (bucket_id = 'school-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Public can view assets"
  on storage.objects for select
  using (bucket_id = 'school-assets');
