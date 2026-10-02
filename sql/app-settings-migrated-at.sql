-- Run once in the Supabase SQL Editor (2026-10-02): marks when this browser's
-- localStorage settings were copied into app_settings. The app's one-time
-- Settings migration only runs while this is null, then sets it.
alter table public.app_settings
  add column if not exists migrated_at timestamptz;
