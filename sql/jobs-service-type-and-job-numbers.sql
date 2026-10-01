-- Run once in the Supabase SQL Editor before the jobs migration (2026-10-01).

-- A home for each job's title
alter table public.jobs
  add column if not exists service_type text;

-- Job numbers: continue after the highest existing one (#1044),
-- so the next job created is #1045
select setval('public.job_number_seq', 1044);

create or replace function public.next_job_number()
returns integer
language sql
security definer
set search_path = public
as $$ select nextval('public.job_number_seq')::integer $$;

grant execute on function public.next_job_number()
  to anon, authenticated;
