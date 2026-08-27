'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function getRequired(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) redirect('/login?error=Preencha todos os campos obrigatórios.');
  return value;
}

export async function login(formData: FormData) {
  const email = getRequired(formData, 'email');
  const password = getRequired(formData, 'password');
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent('E-mail ou senha inválidos.')}`);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const fullName = getRequired(formData, 'fullName');
  const email = getRequired(formData, 'email');
  const password = getRequired(formData, 'password');

  if (password.length < 8) {
    redirect(`/login?error=${encodeURIComponent('A senha precisa ter pelo menos 8 caracteres.')}`);
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https';
  const origin = host ? `${protocol}://${host}` : 'https://navorax.vercel.app';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  revalidatePath('/', 'layout');
  if (data.session) redirect('/onboarding');

  redirect(`/login?message=${encodeURIComponent('Conta criada. Confira seu e-mail para confirmar o acesso.')}`);
}
