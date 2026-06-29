-- ============================================================================
-- Company-branch (venue location) support — ADDITIVE & NON-DESTRUCTIVE.
--
-- "branch" = a MatchPoint physical location (main / dedaena / saburtalo),
-- NOT a git branch. Every existing row backfills to 'main' automatically, so
-- current data simply becomes the main branch's data. No row is updated,
-- deleted, or truncated. Safe to run multiple times (idempotent).
--
-- Run this in the Supabase SQL editor AFTER taking your usual snapshot/backup.
-- ============================================================================

-- 1) Add the branch column to every per-branch table.
--    NOT NULL DEFAULT 'main' => Postgres backfills all existing rows with 'main'.
alter table public.live_timers     add column if not exists branch text not null default 'main';
alter table public.bookings        add column if not exists branch text not null default 'main';
alter table public.session_history add column if not exists branch text not null default 'main';
alter table public.bar_sales       add column if not exists branch text not null default 'main';

-- 2) live_timers: primary key becomes (branch, table_id).
--    Only the constraint/index is rebuilt — no row data is read or changed.
--    Can't collide: existing rows are all branch='main' with unique table_id.
do $$
declare
  pk_name text;
begin
  select conname into pk_name
  from pg_constraint
  where conrelid = 'public.live_timers'::regclass and contype = 'p';

  if pk_name is not null then
    execute format('alter table public.live_timers drop constraint %I', pk_name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.live_timers'::regclass and contype = 'p'
  ) then
    alter table public.live_timers
      add constraint live_timers_pkey primary key (branch, table_id);
  end if;
end $$;

-- 3) Indexes for branch-filtered reads.
create index if not exists bookings_branch_idx        on public.bookings (branch);
create index if not exists session_history_branch_idx on public.session_history (branch);
create index if not exists bar_sales_branch_idx       on public.bar_sales (branch);

-- 4) Guarded live-timer upsert — now branch-aware (conflict on branch+table_id).
--    A missing `branch` in the payload coalesces to 'main', so the currently
--    deployed frontend keeps working unchanged against the main branch.
create or replace function public.upsert_live_timers_guarded(payload jsonb)
returns void
language plpgsql
as $$
begin
  insert into public.live_timers (
    branch,
    table_id,
    name,
    is_available,
    timer_start_time,
    elapsed_time_in_seconds,
    is_running,
    timer_mode,
    initial_countdown_seconds,
    session_start_time,
    session_end_time,
    fit_pass,
    game_type,
    hourly_rate,
    sync_revision,
    updated_at
  )
  select
    coalesce(row_data.branch, 'main'),
    row_data.table_id,
    row_data.name,
    coalesce(row_data.is_available, true),
    row_data.timer_start_time,
    coalesce(row_data.elapsed_time_in_seconds, 0),
    coalesce(row_data.is_running, false),
    coalesce(row_data.timer_mode, 'standard'),
    row_data.initial_countdown_seconds,
    row_data.session_start_time,
    row_data.session_end_time,
    coalesce(row_data.fit_pass, false),
    coalesce(row_data.game_type, 'pingpong'),
    row_data.hourly_rate,
    coalesce(row_data.sync_revision, 0),
    now()
  from jsonb_to_recordset(coalesce(payload, '[]'::jsonb)) as row_data(
    branch text,
    table_id integer,
    name text,
    is_available boolean,
    timer_start_time bigint,
    elapsed_time_in_seconds numeric,
    is_running boolean,
    timer_mode text,
    initial_countdown_seconds numeric,
    session_start_time bigint,
    session_end_time bigint,
    fit_pass boolean,
    game_type text,
    hourly_rate numeric,
    sync_revision bigint
  )
  on conflict (branch, table_id) do update
  set
    name = excluded.name,
    is_available = excluded.is_available,
    timer_start_time = excluded.timer_start_time,
    elapsed_time_in_seconds = excluded.elapsed_time_in_seconds,
    is_running = excluded.is_running,
    timer_mode = excluded.timer_mode,
    initial_countdown_seconds = excluded.initial_countdown_seconds,
    session_start_time = excluded.session_start_time,
    session_end_time = excluded.session_end_time,
    fit_pass = excluded.fit_pass,
    game_type = excluded.game_type,
    hourly_rate = excluded.hourly_rate,
    sync_revision = excluded.sync_revision,
    updated_at = now()
  where excluded.sync_revision > public.live_timers.sync_revision;
end;
$$;

grant execute on function public.upsert_live_timers_guarded(jsonb) to anon, authenticated;
