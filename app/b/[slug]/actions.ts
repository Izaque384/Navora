'use server';

import { createClient } from '@/lib/supabase/server';

type SlotInput = { slug: string; professionalId: string; serviceId: string; date: string };
export type BookingState = { ok: boolean; message: string };

export async function getPublicSlots(input: SlotInput) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return { ok: false as const, message: 'Seleção inválida.', slots: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_public_appointment_slots', {
    p_slug: input.slug, p_professional_id: input.professionalId, p_service_id: input.serviceId, p_date: input.date,
  });
  if (error) return { ok: false as const, message: 'Não foi possível consultar os horários.', slots: [] };
  return { ok: true as const, message: '', slots: (data ?? []).map((slot: { start_at: string; end_at: string }) => ({ startAt: slot.start_at, endAt: slot.end_at })) };
}

export async function createPublicBooking(_state: BookingState, formData: FormData): Promise<BookingState> {
  const value = (key: string) => String(formData.get(key) ?? '').trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_public_appointment', {
    p_slug: value('slug'), p_professional_id: value('professionalId'), p_service_id: value('serviceId'),
    p_start_at: value('startAt'), p_customer_name: value('name'), p_customer_phone: value('phone'),
    p_customer_email: value('email'), p_notes: value('notes'),
  });
  if (error?.code === '23P01' || error?.code === 'P0001') return { ok: false, message: 'Esse horário acabou de ser ocupado. Escolha outro.' };
  if (error) return { ok: false, message: 'Não foi possível concluir o agendamento. Revise os dados e tente novamente.' };
  return { ok: true, message: 'Agendamento confirmado! A barbearia já recebeu seu horário.' };
}
