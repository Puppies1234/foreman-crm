-- Run once in the Supabase SQL Editor (2026-10-01): appointment_status becomes
-- the source of truth for an appointment's state (pending / confirmed / completed).

-- replace any existing check on appointment_status, whatever it's named
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.jobs'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%appointment_status%'
  loop
    execute format('alter table public.jobs drop constraint %I', c);
  end loop;
end $$;

alter table public.jobs
  add constraint jobs_appointment_status_check
  check (appointment_status in ('pending','confirmed','completed'));

alter table public.jobs
  alter column appointment_status set default 'pending';

-- never confirmed (#1036, #1044, #1032), plus #1035 (no appointment yet)
update public.jobs set appointment_status = 'pending'
 where id in ('j2','j7','j8','j3');
