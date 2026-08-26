-- Navora initial PostgreSQL schema for Supabase

create extension if not exists pgcrypto;

do $$
begin
  create type public.appointment_status as enum (
    'SCHEDULED',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text,
  active boolean not null default true,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professionals_barbershop_id_idx
  on public.professionals(barbershop_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_min integer not null check (duration_min > 0),
  price numeric(10,2) not null check (price >= 0),
  active boolean not null default true,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_barbershop_id_idx
  on public.services(barbershop_id);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, phone)
);

create index if not exists customers_barbershop_id_idx
  on public.customers(barbershop_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'SCHEDULED',
  notes text,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  professional_id uuid not null references public.professionals(id),
  service_id uuid not null references public.services(id),
  customer_id uuid not null references public.customers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists appointments_barbershop_start_at_idx
  on public.appointments(barbershop_id, start_at);

create index if not exists appointments_professional_start_at_idx
  on public.appointments(professional_id, start_at);

create index if not exists appointments_customer_start_at_idx
  on public.appointments(customer_id, start_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists barbershops_set_updated_at on public.barbershops;
create trigger barbershops_set_updated_at
before update on public.barbershops
for each row execute function public.set_updated_at();

drop trigger if exists professionals_set_updated_at on public.professionals;
create trigger professionals_set_updated_at
before update on public.professionals
for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();
