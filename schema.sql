-- Starter data model. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.franchises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  school_id text not null,
  school_name text not null,
  budget_cents bigint not null default 5000000000,
  win_coins integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  unique(owner_id)
);

create table if not exists public.roster_players (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  source_player_id text,
  display_name text not null,
  position text not null,
  overall integer not null default 50 check (overall between 1 and 99),
  level integer not null default 1,
  attributes jsonb not null default '{}'::jsonb,
  salary_cents bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  season_code text not null unique,
  commissioner_id uuid not null references auth.users(id) on delete cascade,
  season integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, franchise_id)
);

alter table public.franchises enable row level security;
alter table public.roster_players enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

create policy "Owners can read their franchise"
on public.franchises for select using (auth.uid() = owner_id);
create policy "Owners can create their franchise"
on public.franchises for insert with check (auth.uid() = owner_id);
create policy "Owners can update their franchise"
on public.franchises for update using (auth.uid() = owner_id);

create policy "Owners can manage their roster"
on public.roster_players for all
using (exists (
  select 1 from public.franchises f
  where f.id = franchise_id and f.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.franchises f
  where f.id = franchise_id and f.owner_id = auth.uid()
));

create policy "League members can read leagues"
on public.leagues for select using (
  commissioner_id = auth.uid() or exists (
    select 1 from public.league_members lm
    join public.franchises f on f.id = lm.franchise_id
    where lm.league_id = id and f.owner_id = auth.uid()
  )
);
create policy "Users can create leagues"
on public.leagues for insert with check (auth.uid() = commissioner_id);

create policy "Members can read league membership"
on public.league_members for select using (
  exists (
    select 1 from public.franchises f
    where f.id = franchise_id and f.owner_id = auth.uid()
  )
);