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
      h.opens_at,
      h.closes_at,
      s.duration_min
    from public.barbershops b
    join public.business_hours h
      on h.barbershop_id = b.id
     and h.day_of_week = extract(dow from p_date)::smallint
     and h.is_open
    join public.services s
      on s.id = p_service_id
     and s.barbershop_id = b.id
     and s.active
    join public.professionals p
      on p.id = p_professional_id
     and p.barbershop_id = b.id
     and p.active
    where b.id = p_barbershop_id
  ),
  candidates as (
    select
      local_start at time zone settings.timezone as slot_start,
      (local_start + make_interval(mins => settings.duration_min)) at time zone settings.timezone as slot_end
    from settings
    cross join lateral generate_series(
      p_date + settings.opens_at,
      p_date + settings.closes_at - make_interval(mins => settings.duration_min),
      make_interval(mins => settings.slot_interval_min)
    ) as local_start
  )
  select candidates.slot_start, candidates.slot_end
  from candidates
  where candidates.slot_start >= now()
    and not exists (
      select 1
      from public.appointments a
      where a.barbershop_id = p_barbershop_id
        and a.professional_id = p_professional_id
        and a.status in ('SCHEDULED', 'CONFIRMED')
        and tstzrange(a.start_at, a.end_at, '[)') &&
            tstzrange(candidates.slot_start, candidates.slot_end, '[)')
    )
  order by candidates.slot_start;
$$;

revoke all on function public.get_available_appointment_slots(uuid, uuid, uuid, date) from public;
revoke all on function public.get_available_appointment_slots(uuid, uuid, uuid, date) from anon;
grant execute on function public.get_available_appointment_slots(uuid, uuid, uuid, date) to authenticated;
