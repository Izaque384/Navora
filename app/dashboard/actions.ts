'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/navora/current-shop';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function number(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : NaN;
}

export async function createService(formData: FormData) {
  const name = text(formData, 'name');
  const description = text(formData, 'description') || null;
  const durationMin = number(formData, 'durationMin');
  const price = number(formData, 'price');
  if (!name || !Number.isInteger(durationMin) || durationMin <= 0 || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: 'Dados do serviço inválidos.' };
  }

  const { supabase, membership, barbershop } = await getCurrentShop();
  if (!['owner', 'admin'].includes(membership.role)) {
    return { ok: false, error: 'Somente proprietários e administradores podem cadastrar serviços.' };
  }
  const { error } = await supabase.from('services').insert({
    barbershop_id: barbershop.id,
    name,
    description,
    duration_min: durationMin,
    price,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/servicos');
  return { ok: true };
}

export async function createProfessional(formData: FormData) {
  const name = text(formData, 'name');
  const specialty = text(formData, 'specialty') || null;
  if (!name) return { ok: false, error: 'Informe o nome do profissional.' };

  const { supabase, membership, barbershop } = await getCurrentShop();
  if (!['owner', 'admin'].includes(membership.role)) {
    return { ok: false, error: 'Somente proprietários e administradores podem cadastrar profissionais.' };
  }
  const { error } = await supabase.from('professionals').insert({
    barbershop_id: barbershop.id,
    name,
    specialty,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profissionais');
  return { ok: true };
}

export async function createCustomer(formData: FormData) {
  const name = text(formData, 'name');
  const phone = text(formData, 'phone');
  const email = text(formData, 'email') || null;
  if (!name || !phone) return { ok: false, error: 'Nome e telefone são obrigatórios.' };

  const { supabase, barbershop } = await getCurrentShop();
  const { data, error } = await supabase
    .from('customers')
    .upsert({ barbershop_id: barbershop.id, name, phone, email }, { onConflict: 'barbershop_id,phone' })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/clientes');
  return { ok: true, customerId: data.id };
}

export async function createAppointment(formData: FormData) {
  const professionalId = text(formData, 'professionalId');
  const serviceId = text(formData, 'serviceId');
  const customerId = text(formData, 'customerId');
  const startAtRaw = text(formData, 'startAt');
  const notes = text(formData, 'notes') || null;
  if (!professionalId || !serviceId || !customerId || !startAtRaw) {
    return { ok: false, error: 'Preencha profissional, serviço, cliente e horário.' };
  }

  const startAt = new Date(startAtRaw);
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: 'Horário inválido.' };

  const { supabase, barbershop } = await getCurrentShop();
  const [{ data: service, error: serviceError }, customerResult, slotsResult] = await Promise.all([
    supabase.from('services').select('duration_min').eq('id', serviceId).eq('barbershop_id', barbershop.id).eq('active', true).single(),
    supabase.from('customers').select('id').eq('id', customerId).eq('barbershop_id', barbershop.id).single(),
    supabase.rpc('get_available_appointment_slots', {
      p_barbershop_id: barbershop.id,
      p_professional_id: professionalId,
      p_service_id: serviceId,
      p_date: new Intl.DateTimeFormat('en-CA', { timeZone: barbershop.timezone }).format(startAt),
    }),
  ]);

  if (serviceError || !service) return { ok: false, error: 'Serviço inválido.' };
  if (customerResult.error || !customerResult.data) return { ok: false, error: 'Cliente inválido.' };
  if (slotsResult.error) return { ok: false, error: 'Não foi possível validar a disponibilidade.' };
  const selectedSlot = (slotsResult.data ?? []).find((slot: { start_at: string }) => new Date(slot.start_at).getTime() === startAt.getTime());
  if (!selectedSlot) return { ok: false, error: 'Esse horário não está mais disponível.' };
  const endAt = new Date(startAt.getTime() + service.duration_min * 60_000);

  const { error } = await supabase.from('appointments').insert({
    barbershop_id: barbershop.id,
    professional_id: professionalId,
    service_id: serviceId,
    customer_id: customerId,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    notes,
  });

  if (error?.code === '23P01') return { ok: false, error: 'Esse profissional já possui um atendimento nesse horário.' };
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/agenda');
  return { ok: true };
}

type AvailabilityInput = {
  professionalId: string;
  serviceId: string;
  date: string;
};

export async function getAvailableAppointmentSlots(input: AvailabilityInput) {
  if (!/^[0-9a-f-]{36}$/i.test(input.professionalId) || !/^[0-9a-f-]{36}$/i.test(input.serviceId) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false as const, error: 'Seleção inválida.', slots: [] };
  }

  const { supabase, barbershop } = await getCurrentShop();
  const { data, error } = await supabase.rpc('get_available_appointment_slots', {
      p_barbershop_id: barbershop.id,
      p_professional_id: input.professionalId,
      p_service_id: input.serviceId,
      p_date: input.date,
    });

  if (error) return { ok: false as const, error: 'Não foi possível consultar os horários.', slots: [] };
  const formatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: barbershop.timezone });
  const slots = (data ?? []).map((slot: { start_at: string; end_at: string }) => ({
    startAt: slot.start_at,
    endAt: slot.end_at,
    label: formatter.format(new Date(slot.start_at)),
  }));

  return { ok: true as const, slots };
}

export async function updateAppointmentStatus(formData: FormData) {
  const appointmentId = text(formData, 'appointmentId');
  const status = text(formData, 'status');
  const allowed = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  if (!appointmentId || !allowed.includes(status)) return { ok: false, error: 'Status inválido.' };

  const { supabase, barbershop } = await getCurrentShop();
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .eq('barbershop_id', barbershop.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/agenda');
  return { ok: true };
}
