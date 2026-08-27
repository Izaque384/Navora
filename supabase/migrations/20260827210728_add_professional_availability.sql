alter table public.professionals
  add column if not exists uses_business_hours boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'professionals_id_barbershop_id_key'
      and conrelid = 'public.professionals'::regclass
  ) then
    alter table public.professionals
      add constraint professionals_id_barbershop_id_key unique (id, barbershop_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'services_id_barbershop_id_key'
      and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_id_barbershop_id_key unique (id, barbershop_id);
  end if;
end $$;

create table if not exists public.professional_hours (
  professional_id uuid not null,
  barbershop_id uuid not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_working boolean not null default true,
  starts_at time not null default '09:00',
  ends_at time not null default '19:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (professional_id, day_of_week),
  foreign key (professional_id, barbershop_id)
    references public.professionals(id, barbershop_id) on delete cascade,
  check (not is_working or ends_at > starts_at)
);

create index if not exists professional_hours_barbershop_id_idx
  on public.professional_hours(barbershop_id);

create table if not exists public.professional_services (
  professional_id uuid not null,
  service_id uuid not null,
  barbershop_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (professional_id, service_id),
  foreign key (professional_id, barbershop_id)
    references public.professionals(id, barbershop_id) on delete cascade,
  foreign key (service_id, barbershop_id)
    references public.services(id, barbershop_id) on delete cascade
);

create index if not exists professional_services_service_id_idx
  on public.professional_services(service_id);
create index if not exists professional_services_barbershop_id_idx
  on public.professional_services(barbershop_id);

create table if not exists public.professional_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null,
  barbershop_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (professional_id, barbershop_id)
    references public.professionals(id, barbershop_id) on delete cascade,
  check (ends_at > starts_at)
);

create index if not exists professional_blocks_barbershop_id_idx
  on public.professional_blocks(barbershop_id);
create index if not exists professional_blocks_professional_range_idx
  on public.professional_blocks using gist
    (professional_id, tstzrange(starts_at, ends_at, '[)'));

alter table public.professional_hours enable row level security;
alter table public.professional_services enable row level security;
alter table public.professional_blocks enable row level security;

drop policy if exists professionals_member_insert on public.professionals;
create policy professionals_admin_insert on public.professionals
  for insert to authenticated
  with check ((select private.barbershop_role(professionals.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));
drop policy if exists services_member_insert on public.services;
create policy services_admin_insert on public.services
  for insert to authenticated
  with check ((select private.barbershop_role(services.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));

grant select, insert, update, delete on public.professional_hours to authenticated;
grant select, insert, update, delete on public.professional_services to authenticated;
grant select, insert, update, delete on public.professional_blocks to authenticated;
revoke all on public.professional_hours from anon;
revoke all on public.professional_services from anon;
revoke all on public.professional_blocks from anon;

create policy professional_hours_member_select on public.professional_hours
  for select to authenticated
  using ((select private.is_barbershop_member(professional_hours.barbershop_id, (select auth.uid()))));
create policy professional_hours_admin_insert on public.professional_hours
  for insert to authenticated
  with check ((select private.barbershop_role(professional_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));
create policy professional_hours_admin_update on public.professional_hours
  for update to authenticated
  using ((select private.barbershop_role(professional_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]))
  with check ((select private.barbershop_role(professional_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));
create policy professional_hours_admin_delete on public.professional_hours
  for delete to authenticated
  using ((select private.barbershop_role(professional_hours.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));

create policy professional_services_member_select on public.professional_services
  for select to authenticated
  using ((select private.is_barbershop_member(professional_services.barbershop_id, (select auth.uid()))));
create policy professional_services_admin_insert on public.professional_services
  for insert to authenticated
  with check ((select private.barbershop_role(professional_services.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));
create policy professional_services_admin_delete on public.professional_services
  for delete to authenticated
  using ((select private.barbershop_role(professional_services.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));

create policy professional_blocks_member_select on public.professional_blocks
  for select to authenticated
  using ((select private.is_barbershop_member(professional_blocks.barbershop_id, (select auth.uid()))));
create policy professional_blocks_admin_insert on public.professional_blocks
  for insert to authenticated
  with check ((select private.barbershop_role(professional_blocks.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));
create policy professional_blocks_admin_update on public.professional_blocks
  for update to authenticated
  using ((select private.barbershop_role(professional_blocks.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]))
  with check ((select private.barbershop_role(professional_blocks.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));
create policy professional_blocks_admin_delete on public.professional_blocks
  for delete to authenticated
  using ((select private.barbershop_role(professional_blocks.barbershop_id, (select auth.uid()))) = any (array['owner'::public.member_role, 'admin'::public.member_role]));

drop trigger if exists professional_hours_set_updated_at on public.professional_hours;
create trigger professional_hours_set_updated_at before update on public.professional_hours
for each row execute function public.set_updated_at();
drop trigger if exists professional_blocks_set_updated_at on public.professional_blocks;
create trigger professional_blocks_set_updated_at before update on public.professional_blocks
for each row execute function public.set_updated_at();

insert into public.professional_hours (professional_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
select p.id, p.barbershop_id, h.day_of_week, h.is_open, h.opens_at, h.closes_at
from public.professionals p
join public.business_hours h on h.barbershop_id = p.barbershop_id
on conflict (professional_id, day_of_week) do nothing;

insert into public.professional_services (professional_id, service_id, barbershop_id)
select p.id, s.id, p.barbershop_id
from public.professionals p
join public.services s on s.barbershop_id = p.barbershop_id and s.active
on conflict (professional_id, service_id) do nothing;

create or replace function public.initialize_professional_availability()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.professional_hours (professional_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
  select new.id, new.barbershop_id, h.day_of_week, h.is_open, h.opens_at, h.closes_at
  from public.business_hours h
  where h.barbershop_id = new.barbershop_id
  on conflict (professional_id, day_of_week) do nothing;

  insert into public.professional_services (professional_id, service_id, barbershop_id)
  select new.id, s.id, new.barbershop_id
  from public.services s
  where s.barbershop_id = new.barbershop_id and s.active
  on conflict (professional_id, service_id) do nothing;
  return new;
end;
$$;

drop trigger if exists professionals_initialize_availability on public.professionals;
create trigger professionals_initialize_availability
after insert on public.professionals
for each row execute function public.initialize_professional_availability();

create or replace function public.link_new_service_to_professionals()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.active then
    insert into public.professional_services (professional_id, service_id, barbershop_id)
    select p.id, new.id, new.barbershop_id
    from public.professionals p
    where p.barbershop_id = new.barbershop_id and p.active
    on conflict (professional_id, service_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists services_link_professionals on public.services;
create trigger services_link_professionals
after insert on public.services
for each row execute function public.link_new_service_to_professionals();

create or replace function public.save_professional_availability(
  p_barbershop_id uuid,
  p_professional_id uuid,
  p_uses_business_hours boolean,
  p_hours jsonb,
  p_service_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_valid_service_count integer;
begin
  if coalesce(private.barbershop_role(p_barbershop_id, (select auth.uid()))::text, '') not in ('owner', 'admin') then
    raise exception 'insufficient privileges' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.professionals
    where id = p_professional_id and barbershop_id = p_barbershop_id
  ) then
    raise exception 'professional not found' using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_hours) <> 'array' or jsonb_array_length(p_hours) <> 7 then
    raise exception 'invalid weekly schedule' using errcode = '22023';
  end if;

  select count(*) into v_valid_service_count
  from public.services
  where barbershop_id = p_barbershop_id
    and active
    and id = any(coalesce(p_service_ids, array[]::uuid[]));

  if v_valid_service_count <> cardinality(coalesce(p_service_ids, array[]::uuid[])) then
    raise exception 'invalid service selection' using errcode = '22023';
  end if;

  update public.professionals
  set uses_business_hours = p_uses_business_hours
  where id = p_professional_id and barbershop_id = p_barbershop_id;

  delete from public.professional_hours where professional_id = p_professional_id;
  insert into public.professional_hours (professional_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
  select p_professional_id, p_barbershop_id, x.day_of_week, x.is_working, x.starts_at, x.ends_at
  from jsonb_to_recordset(p_hours) as x(day_of_week smallint, is_working boolean, starts_at time, ends_at time);

  delete from public.professional_services where professional_id = p_professional_id;
  insert into public.professional_services (professional_id, service_id, barbershop_id)
  select p_professional_id, s.id, p_barbershop_id
  from public.services s
  where s.barbershop_id = p_barbershop_id
    and s.active
    and s.id = any(coalesce(p_service_ids, array[]::uuid[]));
end;
$$;

revoke all on function public.save_professional_availability(uuid, uuid, boolean, jsonb, uuid[]) from public, anon;
grant execute on function public.save_professional_availability(uuid, uuid, boolean, jsonb, uuid[]) to authenticated;

create or replace function public.add_professional_block(
  p_barbershop_id uuid,
  p_professional_id uuid,
  p_starts_local timestamp,
  p_ends_local timestamp,
  p_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_timezone text;
  v_start timestamptz;
  v_end timestamptz;
  v_id uuid;
begin
  if coalesce(private.barbershop_role(p_barbershop_id, (select auth.uid()))::text, '') not in ('owner', 'admin') then
    raise exception 'insufficient privileges' using errcode = '42501';
  end if;

  select b.timezone into v_timezone
  from public.barbershops b
  join public.professionals p on p.barbershop_id = b.id
  where b.id = p_barbershop_id and p.id = p_professional_id;

  if v_timezone is null then
    raise exception 'professional not found' using errcode = 'P0002';
  end if;

  v_start := p_starts_local at time zone v_timezone;
  v_end := p_ends_local at time zone v_timezone;
  if v_end <= v_start then
    raise exception 'block end must be after start' using errcode = '22023';
  end if;

  insert into public.professional_blocks (professional_id, barbershop_id, starts_at, ends_at, reason)
  values (p_professional_id, p_barbershop_id, v_start, v_end, nullif(trim(p_reason), ''))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.add_professional_block(uuid, uuid, timestamp, timestamp, text) from public, anon;
grant execute on function public.add_professional_block(uuid, uuid, timestamp, timestamp, text) to authenticated;

create or replace function public.get_available_appointment_slots(
  p_barbershop_id uuid,
  p_professional_id uuid,
  p_service_id uuid,
  p_date date
)
returns table (start_at timestamptz, end_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with settings as (
    select
      b.timezone,
      b.slot_interval_min,
      s.duration_min,
      case when p.uses_business_hours then h.opens_at else greatest(h.opens_at, ph.starts_at) end as opens_at,
      case when p.uses_business_hours then h.closes_at else least(h.closes_at, ph.ends_at) end as closes_at
    from public.barbershops b
    join public.business_hours h
      on h.barbershop_id = b.id
     and h.day_of_week = extract(dow from p_date)::smallint
     and h.is_open
    join public.services s
      on s.id = p_service_id and s.barbershop_id = b.id and s.active
    join public.professionals p
      on p.id = p_professional_id and p.barbershop_id = b.id and p.active
    join public.professional_services ps
      on ps.professional_id = p.id and ps.service_id = s.id and ps.barbershop_id = b.id
    left join public.professional_hours ph
      on ph.professional_id = p.id and ph.day_of_week = h.day_of_week
    where b.id = p_barbershop_id
      and (p.uses_business_hours or ph.is_working = true)
  ),
  valid_settings as (
    select * from settings
    where closes_at > opens_at + make_interval(mins => duration_min)
       or closes_at = opens_at + make_interval(mins => duration_min)
  ),
  candidates as (
    select
      local_start at time zone valid_settings.timezone as slot_start,
      (local_start + make_interval(mins => valid_settings.duration_min)) at time zone valid_settings.timezone as slot_end
    from valid_settings
    cross join lateral generate_series(
      p_date + valid_settings.opens_at,
      p_date + valid_settings.closes_at - make_interval(mins => valid_settings.duration_min),
      make_interval(mins => valid_settings.slot_interval_min)
    ) as local_start
  )
  select candidates.slot_start, candidates.slot_end
  from candidates
  where candidates.slot_start >= now()
    and not exists (
      select 1 from public.appointments a
      where a.barbershop_id = p_barbershop_id
        and a.professional_id = p_professional_id
        and a.status in ('SCHEDULED', 'CONFIRMED')
        and tstzrange(a.start_at, a.end_at, '[)') && tstzrange(candidates.slot_start, candidates.slot_end, '[)')
    )
    and not exists (
      select 1 from public.professional_blocks pb
      where pb.barbershop_id = p_barbershop_id
        and pb.professional_id = p_professional_id
        and tstzrange(pb.starts_at, pb.ends_at, '[)') && tstzrange(candidates.slot_start, candidates.slot_end, '[)')
    )
  order by candidates.slot_start;
$$;

revoke all on function public.get_available_appointment_slots(uuid, uuid, uuid, date) from public, anon;
grant execute on function public.get_available_appointment_slots(uuid, uuid, uuid, date) to authenticated;
