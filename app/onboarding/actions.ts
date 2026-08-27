'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createBarbershop(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const address = String(formData.get('address') ?? '').trim() || null;

  if (name.length < 2) redirect('/onboarding?error=Informe o nome da barbearia.');

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect('/login');

  const baseSlug = slugify(name) || 'barbearia';
  const suffix = crypto.randomUUID().slice(0, 6);
  const slug = `${baseSlug}-${suffix}`;

  const { error } = await supabase.from('barbershops').insert({ name, slug, phone, address });
  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);

  redirect('/dashboard');
}
