'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentShop } from '@/lib/navora/current-shop';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function professionalPath(id: string, kind: 'error' | 'success', message: string) {
  return `/dashboard/profissionais/${id}?${kind}=${encodeURIComponent(message)}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function saveProfessionalAvailability(formData: FormData): Promise<void> {
  const professionalId = text(formData, 'professionalId');
  if (!isUuid(professionalId)) redirect('/dashboard/profissionais');

  const { supabase, membership, barbershop } = await getCurrentShop();
  if (!['owner', 'admin'].includes(membership.role)) {
    redirect(professionalPath(professionalId, 'error', 'Somente proprietários e administradores podem alterar a disponibilidade.'));
  }

  const usesBusinessHours = formData.get('usesBusinessHours') === 'on';
  const hours = Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    is_working: formData.get(`day-${day}-working`) === 'on',
    starts_at: text(formData, `day-${day}-starts`) || '09:00',
    ends_at: text(formData, `day-${day}-ends`) || '19:00',
  }));

  for (const item of hours) {
    if (item.is_working && item.ends_at <= item.starts_at) {
      redirect(professionalPath(professionalId, 'error', 'O fim do expediente precisa ser posterior ao início.'));
    }
  }

  const serviceIds = formData.getAll('serviceIds').map(String).filter(isUuid);
  const { error } = await supabase.rpc('save_professional_availability', {
    p_barbershop_id: barbershop.id,
    p_professional_id: professionalId,
    p_uses_business_hours: usesBusinessHours,
    p_hours: hours,
    p_service_ids: serviceIds,
  });

  if (error) redirect(professionalPath(professionalId, 'error', 'Não foi possível salvar a disponibilidade do profissional.'));
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard/profissionais');
  revalidatePath(`/dashboard/profissionais/${professionalId}`);
  redirect(professionalPath(professionalId, 'success', 'Disponibilidade salva com sucesso.'));
}

export async function createProfessionalBlock(formData: FormData): Promise<void> {
  const professionalId = text(formData, 'professionalId');
  if (!isUuid(professionalId)) redirect('/dashboard/profissionais');

  const { supabase, membership, barbershop } = await getCurrentShop();
  if (!['owner', 'admin'].includes(membership.role)) {
    redirect(professionalPath(professionalId, 'error', 'Você não possui permissão para criar bloqueios.'));
  }

  const startsLocal = text(formData, 'startsLocal');
  const endsLocal = text(formData, 'endsLocal');
  const reason = text(formData, 'reason');
  const localPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!localPattern.test(startsLocal) || !localPattern.test(endsLocal) || endsLocal <= startsLocal) {
    redirect(professionalPath(professionalId, 'error', 'Informe um período de bloqueio válido.'));
  }

  const { error } = await supabase.rpc('add_professional_block', {
    p_barbershop_id: barbershop.id,
    p_professional_id: professionalId,
    p_starts_local: startsLocal,
    p_ends_local: endsLocal,
    p_reason: reason,
  });

  if (error) redirect(professionalPath(professionalId, 'error', 'Não foi possível adicionar o bloqueio.'));
  revalidatePath('/dashboard/agenda');
  revalidatePath(`/dashboard/profissionais/${professionalId}`);
  redirect(professionalPath(professionalId, 'success', 'Bloqueio adicionado à agenda.'));
}

export async function deleteProfessionalBlock(formData: FormData): Promise<void> {
  const professionalId = text(formData, 'professionalId');
  const blockId = text(formData, 'blockId');
  if (!isUuid(professionalId) || !isUuid(blockId)) redirect('/dashboard/profissionais');

  const { supabase, membership, barbershop } = await getCurrentShop();
  if (!['owner', 'admin'].includes(membership.role)) {
    redirect(professionalPath(professionalId, 'error', 'Você não possui permissão para remover bloqueios.'));
  }

  const { error } = await supabase.from('professional_blocks').delete()
    .eq('id', blockId)
    .eq('professional_id', professionalId)
    .eq('barbershop_id', barbershop.id);

  if (error) redirect(professionalPath(professionalId, 'error', 'Não foi possível remover o bloqueio.'));
  revalidatePath('/dashboard/agenda');
  revalidatePath(`/dashboard/profissionais/${professionalId}`);
  redirect(professionalPath(professionalId, 'success', 'Bloqueio removido.'));
}
