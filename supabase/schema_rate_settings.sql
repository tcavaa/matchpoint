-- ============================================================================
-- Rate settings — prices managed from each location's Rate Settings page.
--
-- One row per location (branch = 'main' / 'dedaena' / 'saburtalo'), shared by
-- every device at that location. Rows are created the first time someone
-- presses Save on that location's Rate Settings page; until then the app uses
-- its built-in default prices.
--
-- New table only — nothing existing is changed. Safe to run multiple times.
-- Run this in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.rate_settings (
  branch text primary key default 'main',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.rate_settings enable row level security;

drop policy if exists "rate_settings_public_rw" on public.rate_settings;
create policy "rate_settings_public_rw"
on public.rate_settings
for all
to anon, authenticated
using (true)
with check (true);

-- Live updates, so a price change reaches that location's other devices immediately
do $$
begin
  alter publication supabase_realtime add table public.rate_settings;
exception
  when duplicate_object then null;
end
$$;
