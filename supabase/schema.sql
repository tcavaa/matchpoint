-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.menu_items (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  image text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.session_history (
  id uuid primary key default gen_random_uuid(),
  table_id integer not null,
  table_name text not null,
  end_time timestamptz not null,
  duration_played numeric not null default 0,
  amount_paid numeric(10,2) not null default 0,
  session_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bar_sales (
  id uuid primary key default gen_random_uuid(),
  "timestamp" timestamptz not null,
  items text not null,
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.live_timers (
  table_id integer primary key,
  name text not null,
  is_available boolean not null default true,
  timer_start_time bigint null,
  elapsed_time_in_seconds numeric not null default 0,
  is_running boolean not null default false,
  timer_mode text not null default 'standard',
  initial_countdown_seconds numeric null,
  session_start_time bigint null,
  session_end_time bigint null,
  fit_pass boolean not null default false,
  game_type text not null default 'pingpong',
  hourly_rate numeric null,
  sync_revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  tables_count integer not null check (tables_count > 0),
  hours_count numeric not null check (hours_count > 0),
  is_done boolean not null default false,
  done_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.session_history enable row level security;
alter table public.bar_sales enable row level security;
alter table public.live_timers enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "menu_items_public_rw" on public.menu_items;
create policy "menu_items_public_rw"
on public.menu_items
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "session_history_public_rw" on public.session_history;
create policy "session_history_public_rw"
on public.session_history
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "bar_sales_public_rw" on public.bar_sales;
create policy "bar_sales_public_rw"
on public.bar_sales
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "live_timers_public_rw" on public.live_timers;
create policy "live_timers_public_rw"
on public.live_timers
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "bookings_public_rw" on public.bookings;
create policy "bookings_public_rw"
on public.bookings
for all
to anon, authenticated
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table public.live_timers;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end
$$;

alter table public.live_timers
add column if not exists sync_revision bigint not null default 0;

alter table public.bookings
add column if not exists is_done boolean not null default false;

alter table public.bookings
add column if not exists done_at timestamptz null;

