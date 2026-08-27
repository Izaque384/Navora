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
  if not exists (
    select 1 from public.barbershop_members bm
    where bm.barbershop_id = p_barbershop_id
      and bm.user_id = (select auth.uid())
      and bm.role in ('owner', 'admin')
  ) then
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
  if not exists (
    select 1 from public.barbershop_members bm
    where bm.barbershop_id = p_barbershop_id
      and bm.user_id = (select auth.uid())
      and bm.role in ('owner', 'admin')
  ) then
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

revoke all on function public.save_professional_availability(uuid, uuid, boolean, jsonb, uuid[]) from public, anon;
grant execute on function public.save_professional_availability(uuid, uuid, boolean, jsonb, uuid[]) to authenticated;
revoke all on function public.add_professional_block(uuid, uuid, timestamp, timestamp, text) from public, anon;
grant execute on function public.add_professional_block(uuid, uuid, timestamp, timestamp, text) to authenticated;
