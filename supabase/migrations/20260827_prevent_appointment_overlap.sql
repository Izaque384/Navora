create extension if not exists btree_gist with schema extensions;

alter table public.appointments
  add constraint appointments_no_professional_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status in ('SCHEDULED','CONFIRMED'));
