alter function public.set_updated_at() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_barbershop_owner() from public, anon, authenticated;
