import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getCurrentShop() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect('/login');

  const { data: membership } = await supabase
    .from('barbershop_members')
    .select('barbershop_id, role, barbershops(id, name, slug, timezone, slot_interval_min, public_booking_enabled)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect('/onboarding');

  const barbershop = Array.isArray(membership.barbershops)
    ? membership.barbershops[0]
    : membership.barbershops;

  if (!barbershop) redirect('/onboarding');

  return {
    supabase,
    userId,
    membership,
    barbershop,
  };
}
