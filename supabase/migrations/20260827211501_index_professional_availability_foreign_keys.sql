create index if not exists professional_hours_professional_shop_idx
  on public.professional_hours(professional_id, barbershop_id);

create index if not exists professional_services_professional_shop_idx
  on public.professional_services(professional_id, barbershop_id);

create index if not exists professional_services_service_shop_idx
  on public.professional_services(service_id, barbershop_id);

create index if not exists professional_blocks_professional_shop_idx
  on public.professional_blocks(professional_id, barbershop_id);
