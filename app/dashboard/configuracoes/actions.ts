'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentShop } from '@/lib/navora/current-shop';

const validIntervals = new Set([5, 10, 15, 20, 30, 45, 60]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export async function saveSettings(formData: FormData): Promise<void> {
  const { supabase, membership, barbershop } = await getCurrentShop();

  if (!['owner', 'admin'].includes(membership.role)) {
    redirect('/dashboard/configuracoes?error=Somente proprietários e administradores podem alterar as configurações.');
  }

  const name = text(formData, 'name');
  const slug = normalizeSlug(text(formData, 'slug'));
  const phone = text(formData, 'phone');
  const address = text(formData, 'address');
  const timezone = text(formData, 'timezone') || 'America/Sao_Paulo';
  const interval = Number(text(formData, 'slotIntervalMin'));
  const publicBookingEnabled = formData.get('publicBookingEnabled') === 'on';

  if (!name || !slug) {
    redirect('/dashboard/configuracoes?error=Nome e link público são obrigatórios.');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect('/dashboard/configuracoes?error=O link público contém caracteres inválidos.');
  }

  if (!validIntervals.has(interval)) {
    redirect('/dashboard/configuracoes?error=Escolha um intervalo de agenda válido.');
  }

  const { error: shopError } = await supabase
    .from('barbershops')
    .update({
      name,
      slug,
      phone: phone || null,
      address: address || null,
      timezone,
      slot_interval_min: interval,
      public_booking_enabled: publicBookingEnabled,
    })
    .eq('id', barbershop.id);

  if (shopError) {
    const message = shopError.code === '23505'
      ? 'Esse link público já está sendo usado por outra barbearia.'
      : 'Não foi possível salvar os dados da barbearia.';
    redirect(`/dashboard/configuracoes?error=${encodeURIComponent(message)}`);
  }

  const hours = Array.from({ length: 7 }, (_, day) => {
    const isOpen = formData.get(`day-${day}-open`) === 'on';
    const opensAt = text(formData, `day-${day}-opens`) || '09:00';
    const closesAt = text(formData, `day-${day}-closes`) || '19:00';
    return {
      barbershop_id: barbershop.id,
      day_of_week: day,
      is_open: isOpen,
      opens_at: opensAt,
      closes_at: closesAt,
    };
  });

  for (const item of hours) {
    if (item.is_open && item.closes_at <= item.opens_at) {
      redirect('/dashboard/configuracoes?error=O horário de fechamento precisa ser posterior ao horário de abertura.');
    }
  }

  const { error: hoursError } = await supabase
    .from('business_hours')
    .upsert(hours, { onConflict: 'barbershop_id,day_of_week' });

  if (hoursError) {
    redirect('/dashboard/configuracoes?error=Os dados principais foram salvos, mas houve um erro nos horários de funcionamento.');
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/configuracoes');
  redirect('/dashboard/configuracoes?success=Configurações salvas com sucesso.');
}
