-- College Football Dynasty milestone 2 schema.
-- Run this in Supabase SQL Editor after the original schema.
create table if not exists public.schools (
  id text primary key,
  name text not null unique,
  primary_color text,
  secondary_color text
);

create table if not exists public.recruit_pool (
  id text primary key,
  display_name text not null,
  position text not null,
  position_name text not null,
  unit text not null,
  overall integer not null check (overall between 1 and 99),
  class_year integer not null check (class_year between 2024 and 2027),
  prospect_type text not null check (prospect_type in ('College player','High-school recruit')),
  salary_cents bigint not null check (salary_cents >= 0),
  attributes jsonb not null default '{}'::jsonb,
  data_type text not null default 'verified',
  source_url text,
  updated_at timestamptz not null default now()
);

alter table public.franchises
  add column if not exists primary_color text,
  add column if not exists secondary_color text;

-- A player can only be recruited once into a given franchise, but there is
-- intentionally no positional quota or roster-size constraint.
create table if not exists public.franchise_recruits (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  recruit_id text not null references public.recruit_pool(id),
  signed_salary_cents bigint not null,
  signed_at timestamptz not null default now(),
  unique(franchise_id, recruit_id)
);

alter table public.schools enable row level security;
alter table public.recruit_pool enable row level security;
alter table public.franchise_recruits enable row level security;

create policy "Schools are readable by everyone"
on public.schools for select using (true);
create policy "Recruit pool is readable by everyone"
on public.recruit_pool for select using (true);
create policy "Owners can manage franchise recruits"
on public.franchise_recruits for all
using (exists (
  select 1 from public.franchises f
  where f.id = franchise_id and f.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.franchises f
  where f.id = franchise_id and f.owner_id = auth.uid()
));
