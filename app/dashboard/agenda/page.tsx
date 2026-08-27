import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentShop } from '@/lib/navora/current-shop';
import { createAppointment, updateAppointmentStatus } from '../actions';

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

export default async function AgendaPage() {
  const { supabase, membership, barbershop } = await getCurrentShop();
  const [appointmentsResult, customersResult, servicesResult, professionalsResult] = await Promise.all([
    supabase.from('appointments').select('id, start_at, end_at, status, notes, customers(name), services(name), professionals(name)').eq('barbershop_id', barbershop.id).order('start_at').limit(80),
    supabase.from('customers').select('id, name, phone').eq('barbershop_id', barbershop.id).order('name'),
    supabase.from('services').select('id, name, duration_min').eq('barbershop_id', barbershop.id).eq('active', true).order('name'),
    supabase.from('professionals').select('id, name').eq('barbershop_id', barbershop.id).eq('active', true).order('name'),
  ]);

  const appointments = appointmentsResult.data ?? [];
  const customers = customersResult.data ?? [];
  const services = servicesResult.data ?? [];
  const professionals = professionalsResult.data ?? [];
  const canCreate = customers.length > 0 && services.length > 0 && professionals.length > 0;

  async function submitAppointment(formData: FormData) {
    'use server';
    await createAppointment(formData);
  }

  async function submitStatus(formData: FormData) {
    'use server';
    await updateAppointmentStatus(formData);
  }

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="agenda">
      <div className="dashhead"><div><div className="eyebrow">OPERAÇÃO</div><h1>Agenda</h1><p>Crie atendimentos e acompanhe o status de cada horário.</p></div></div>
      <div className="management-grid agenda-management">
        <section className="section-card form-card">
          <div className="section-head"><div><h2>Novo agendamento</h2><p className="caption">Conflitos de horário do mesmo profissional são bloqueados pelo banco.</p></div></div>
          {!canCreate ? (
            <div className="empty-state compact">Cadastre pelo menos um cliente, serviço e profissional antes de agendar.</div>
          ) : (
            <form action={submitAppointment} className="admin-form">
              <label>Cliente<select name="customerId" required defaultValue=""><option value="" disabled>Selecione</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}</select></label>
              <label>Serviço<select name="serviceId" required defaultValue=""><option value="" disabled>Selecione</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.duration_min} min</option>)}</select></label>
              <label>Profissional<select name="professionalId" required defaultValue=""><option value="" disabled>Selecione</option>{professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Data e horário<input type="datetime-local" name="startAt" required /></label>
              <label>Observações<textarea name="notes" rows={3} placeholder="Opcional" /></label>
              <button className="button full" type="submit">Criar agendamento</button>
            </form>
          )}
        </section>
        <section className="section-card list-card">
          <div className="section-head"><div><h2>Atendimentos</h2><p className="caption">{appointments.length} agendamento(s)</p></div></div>
          <div className="data-list agenda-list">
            {appointments.length === 0 && <p className="empty-state">A agenda ainda está vazia.</p>}
            {appointments.map((appointment) => {
              const customer = Array.isArray(appointment.customers) ? appointment.customers[0] : appointment.customers;
              const service = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services;
              const professional = Array.isArray(appointment.professionals) ? appointment.professionals[0] : appointment.professionals;
              const date = new Date(appointment.start_at);
              return (
                <div className="agenda-row" key={appointment.id}>
                  <div className="agenda-date"><strong>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })}</strong><span>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</span></div>
                  <div className="agenda-person"><b>{customer?.name ?? 'Cliente'}</b><small>{service?.name ?? 'Serviço'} · {professional?.name ?? 'Profissional'}</small>{appointment.notes && <small>{appointment.notes}</small>}</div>
                  <form action={submitStatus} className="status-form">
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <select name="status" defaultValue={appointment.status} aria-label="Status do agendamento">
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="submit">Salvar</button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
