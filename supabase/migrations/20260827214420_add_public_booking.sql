drop policy if exists professional_services_public_select on public.professional_services;
create policy professional_services_public_select on public.professional_services
  for select to anon
  using (exists (
    select 1 from public.barbershops b
    where b.id = professional_services.barbershop_id and b.public_booking_enabled
  ));
grant select on public.professional_services to anon;

create or replace function public.get_public_appointment_slots(
  p_slug text,
  p_professional_id uuid,
  p_service_id uuid,
  p_date date
)
returns table (start_at timestamptz, end_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with settings as (
    select b.id as barbershop_id, b.timezone, b.slot_interval_min, s.duration_min,
      case when p.uses_business_hours then h.opens_at else greatest(h.opens_at, ph.starts_at) end as opens_at,
      case when p.uses_business_hours then h.closes_at else least(h.closes_at, ph.ends_at) end as closes_at
    from public.barbershops b
    join public.business_hours h on h.barbershop_id = b.id
      and h.day_of_week = extract(dow from p_date)::smallint and h.is_open
    join public.services s on s.id = p_service_id and s.barbershop_id = b.id and s.active
    join public.professionals p on p.id = p_professional_id and p.barbershop_id = b.id and p.active
    join public.professional_services ps on ps.professional_id = p.id and ps.service_id = s.id and ps.barbershop_id = b.id
    left join public.professional_hours ph on ph.professional_id = p.id and ph.day_of_week = h.day_of_week
    where b.slug = lower(trim(p_slug)) and b.public_booking_enabled
      and (p.uses_business_hours or ph.is_working = true)
  ), candidates as (
    select settings.barbershop_id,
      local_start at time zone settings.timezone as slot_start,
      (local_start + make_interval(mins => settings.duration_min)) at time zone settings.timezone as slot_end
    from settings
    cross join lateral generate_series(
      p_date + settings.opens_at,
      p_date + settings.closes_at - make_interval(mins => settings.duration_min),
      make_interval(mins => settings.slot_interval_min)
    ) local_start
    where settings.closes_at >= settings.opens_at + make_interval(mins => settings.duration_min)
  )
  select c.slot_start, c.slot_end from candidates c
  where c.slot_start >= now()
    and not exists (
      select 1 from public.appointments a where a.barbershop_id = c.barbershop_id
        and a.professional_id = p_professional_id and a.status in ('SCHEDULED','CONFIRMED')
        and tstzrange(a.start_at,a.end_at,'[)') && tstzrange(c.slot_start,c.slot_end,'[)')
    )
    and not exists (
      select 1 from public.professional_blocks pb where pb.barbershop_id = c.barbershop_id
        and pb.professional_id = p_professional_id
        and tstzrange(pb.starts_at,pb.ends_at,'[)') && tstzrange(c.slot_start,c.slot_end,'[)')
    )
  order by c.slot_start;
$$;

revoke all on function public.get_public_appointment_slots(text,uuid,uuid,date) from public;
grant execute on function public.get_public_appointment_slots(text,uuid,uuid,date) to anon, authenticated;

create or replace function public.create_public_appointment(
  p_slug text,
  p_professional_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
  v_customer_id uuid;
  v_end_at timestamptz;
  v_appointment_id uuid;
  v_name text := trim(p_customer_name);
  v_phone text := trim(p_customer_phone);
  v_email text := nullif(lower(trim(p_customer_email)), '');
begin
  if length(v_name) < 2 or length(v_name) > 120 or length(v_phone) < 8 or length(v_phone) > 30
     or length(coalesce(p_notes,'')) > 500 or (v_email is not null and length(v_email) > 200) then
    raise exception 'invalid customer data' using errcode = '22023';
  end if;

  select b.id into v_shop_id from public.barbershops b
  where b.slug = lower(trim(p_slug)) and b.public_booking_enabled;
  if v_shop_id is null then raise exception 'public booking unavailable' using errcode = 'P0002'; end if;

  select slots.end_at into v_end_at
  from public.get_public_appointment_slots(p_slug,p_professional_id,p_service_id,(p_start_at at time zone (select timezone from public.barbershops where id=v_shop_id))::date) slots
  where slots.start_at = p_start_at;
  if v_end_at is null then raise exception 'slot unavailable' using errcode = 'P0001'; end if;

  insert into public.customers (barbershop_id,name,phone,email)
  values (v_shop_id,v_name,v_phone,v_email)
  on conflict (barbershop_id,phone) do update
    set name=excluded.name,email=coalesce(excluded.email,public.customers.email)
  returning id into v_customer_id;

  insert into public.appointments (barbershop_id,professional_id,service_id,customer_id,start_at,end_at,notes)
  values (v_shop_id,p_professional_id,p_service_id,v_customer_id,p_start_at,v_end_at,nullif(trim(p_notes),''))
  returning id into v_appointment_id;
  return v_appointment_id;
end;
$$;

revoke all on function public.create_public_appointment(text,uuid,uuid,timestamptz,text,text,text,text) from public;
grant execute on function public.create_public_appointment(text,uuid,uuid,timestamptz,text,text,text,text) to anon, authenticated;
