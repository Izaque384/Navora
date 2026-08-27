create schema if not exists private;

do $$ begin
  create type public.member_role as enum ('owner','admin','staff');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.barbershop_members (
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (barbershop_id, user_id)
);

create index if not exists barbershop_members_user_id_idx on public.barbershop_members(user_id);

create or replace function private.is_barbershop_member(target_barbershop_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.barbershop_members m
    where m.barbershop_id = target_barbershop_id and m.user_id = target_user_id
  );
$$;

create or replace function private.barbershop_role(target_barbershop_id uuid, target_user_id uuid)
returns public.member_role language sql stable security definer set search_path = '' as $$
  select m.role from public.barbershop_members m
  where m.barbershop_id = target_barbershop_id and m.user_id = target_user_id
  limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.handle_new_barbershop_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is not null then
    insert into public.barbershop_members (barbershop_id, user_id, role)
    values (new.id, current_user_id, 'owner')
    on conflict (barbershop_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_barbershop_created on public.barbershops;
create trigger on_barbershop_created after insert on public.barbershops
for each row execute procedure public.handle_new_barbershop_owner();

alter table public.profiles enable row level security;
alter table public.barbershop_members enable row level security;
alter table public.barbershops enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.barbershop_members to authenticated;
grant select, insert, update, delete on public.barbershops to authenticated;
grant select, insert, update, delete on public.professionals to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select on public.barbershops, public.professionals, public.services to anon;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "barbershops_public_select" on public.barbershops for select to anon, authenticated using (true);
create policy "barbershops_authenticated_insert" on public.barbershops for insert to authenticated with check ((select auth.uid()) is not null);
create policy "barbershops_admin_update" on public.barbershops for update to authenticated
using ((select private.barbershop_role(id, (select auth.uid()))) in ('owner','admin'))
with check ((select private.barbershop_role(id, (select auth.uid()))) in ('owner','admin'));
create policy "barbershops_owner_delete" on public.barbershops for delete to authenticated
using ((select private.barbershop_role(id, (select auth.uid()))) = 'owner');

create policy "members_select_same_shop" on public.barbershop_members for select to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "members_admin_insert" on public.barbershop_members for insert to authenticated
with check ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'));
create policy "members_admin_update" on public.barbershop_members for update to authenticated
using ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'))
with check ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'));
create policy "members_admin_delete" on public.barbershop_members for delete to authenticated
using ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin')
  and not (user_id = (select auth.uid()) and role = 'owner'));

create policy "professionals_public_select" on public.professionals for select to anon, authenticated
using (active = true or (select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "professionals_member_insert" on public.professionals for insert to authenticated
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "professionals_member_update" on public.professionals for update to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))))
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "professionals_admin_delete" on public.professionals for delete to authenticated
using ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'));

create policy "services_public_select" on public.services for select to anon, authenticated
using (active = true or (select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "services_member_insert" on public.services for insert to authenticated
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "services_member_update" on public.services for update to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))))
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "services_admin_delete" on public.services for delete to authenticated
using ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'));

create policy "customers_member_select" on public.customers for select to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "customers_member_insert" on public.customers for insert to authenticated
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "customers_member_update" on public.customers for update to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))))
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "customers_admin_delete" on public.customers for delete to authenticated
using ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'));

create policy "appointments_member_select" on public.appointments for select to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "appointments_member_insert" on public.appointments for insert to authenticated
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "appointments_member_update" on public.appointments for update to authenticated
using ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))))
with check ((select private.is_barbershop_member(barbershop_id, (select auth.uid()))));
create policy "appointments_admin_delete" on public.appointments for delete to authenticated
using ((select private.barbershop_role(barbershop_id, (select auth.uid()))) in ('owner','admin'));
