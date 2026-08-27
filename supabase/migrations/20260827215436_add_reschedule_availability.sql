create or replace function public.get_reschedule_appointment_slots(
  p_barbershop_id uuid,
  p_appointment_id uuid,
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
    join public.appointments current_appointment
      on current_appointment.id = p_appointment_id
     and current_appointment.barbershop_id = b.id
    where b.id = p_barbershop_id
      and (p.uses_business_hours or ph.is_working = true)
  ),
  valid_settings as (
    select * from settings
    where closes_at >= opens_at + make_interval(mins => duration_min)
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
        and a.id <> p_appointment_id
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

revoke all on function public.get_reschedule_appointment_slots(uuid, uuid, uuid, uuid, date) from public, anon;
grant execute on function public.get_reschedule_appointment_slots(uuid, uuid, uuid, uuid, date) to authenticated;
