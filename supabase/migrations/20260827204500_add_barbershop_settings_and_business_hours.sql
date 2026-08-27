alter table public.barbershops
  add column if not exists timezone text not null default 'America/Sao_Paulo',
  add column if not exists slot_interval_min integer not null default 15 check (slot_interval_min between 5 and 120),
  add column if not exists public_booking_enabled boolean not null default true;

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  opens_at time not null default '09:00',
  closes_at time not null default '19:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, day_of_week),
  check (not is_open or closes_at > opens_at)
);

create index if not exists business_hours_barbershop_id_idx on public.business_hours(barbershop_id);

alter table public.business_hours enable row level security;

drop policy if exists business_hours_public_select on public.business_hours;
create policy business_hours_public_select on public.business_hours for select using (true);

drop policy if exists business_hours_admin_insert on public.business_hours;
create policy business_hours_admin_insert on public.business_hours for insert with check (
  (select private.barbershop_role(business_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role])
);

drop policy if exists business_hours_admin_update on public.business_hours;
create policy business_hours_admin_update on public.business_hours for update using (
  (select private.barbershop_role(business_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role])
) with check (
  (select private.barbershop_role(business_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role])
);

drop policy if exists business_hours_admin_delete on public.business_hours;
create policy business_hours_admin_delete on public.business_hours for delete using (
  (select private.barbershop_role(business_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role])
);

drop trigger if exists business_hours_set_updated_at on public.business_hours;
create trigger business_hours_set_updated_at before update on public.business_hours
for each row execute function public.set_updated_at();

insert into public.business_hours (barbershop_id, day_of_week, is_open, opens_at, closes_at)
select b.id, d.day_of_week, case when d.day_of_week = 0 then false else true end, '09:00'::time, '19:00'::time
from public.barbershops b
cross join generate_series(0,6) as d(day_of_week)
on conflict (barbershop_id, day_of_week) do nothing;
