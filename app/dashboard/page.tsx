import { getCurrentShop } from '@/lib/navora/current-shop';
import { DashboardShell } from '@/components/dashboard-shell';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default async function DashboardPage() {
  const { supabase, membership, barbershop } = await getCurrentShop();
  const barbershopId = barbershop.id;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [appointmentsResult, customersResult, professionalsResult, servicesResult, upcomingResult] = await Promise.all([
    supabase.from('appointments').select('id, service_id, status', { count: 'exact' }).eq('barbershop_id', barbershopId).gte('start_at', start.toISOString()).lt('start_at', end.toISOString()),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId),
    supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).eq('active', true),
    supabase.from('services').select('id, price').eq('barbershop_id', barbershopId).eq('active', true),
    supabase.from('appointments').select('id, start_at, status, customers(name), services(name, price), professionals(name)').eq('barbershop_id', barbershopId).gte('start_at', new Date().toISOString()).order('start_at').limit(6),
  ]);

  const servicePrices = new Map((servicesResult.data ?? []).map((service) => [service.id, Number(service.price)]));
  const expectedRevenue = (appointmentsResult.data ?? [])
    .filter((appointment) => appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW')
    .reduce((sum, appointment) => sum + (servicePrices.get(appointment.service_id) ?? 0), 0);

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="overview">
      <div className="dashhead"><div><div className="eyebrow">VISÃO GERAL</div><h1>{barbershop.name}</h1><p>Dados reais da operação, protegidos por usuário e barbearia.</p></div></div>

      <div className="stats">
        <div className="stat"><span>Agendamentos hoje</span><b>{appointmentsResult.count ?? 0}</b><small>agenda do dia</small></div>
        <div className="stat"><span>Faturamento previsto</span><b>{formatCurrency(expectedRevenue)}</b><small>agendamentos ativos</small></div>
        <div className="stat"><span>Clientes</span><b>{customersResult.count ?? 0}</b><small>base cadastrada</small></div>
        <div className="stat"><span>Profissionais ativos</span><b>{professionalsResult.count ?? 0}</b><small>equipe disponível</small></div>
      </div>

      <div className="section-card">
        <div className="section-head"><div><h2>Próximos agendamentos</h2><p className="caption">Agenda carregada do Supabase</p></div></div>
        <div className="schedule">
          {(upcomingResult.data ?? []).length === 0 && <p className="empty-state">Nenhum agendamento futuro ainda.</p>}
          {(upcomingResult.data ?? []).map((appointment) => {
            const customer = Array.isArray(appointment.customers) ? appointment.customers[0] : appointment.customers;
            const service = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services;
            const professional = Array.isArray(appointment.professionals) ? appointment.professionals[0] : appointment.professionals;
            return (
              <div className="appointment" key={appointment.id}>
                <time>{new Date(appointment.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                <div className="appointment-person"><b>{customer?.name ?? 'Cliente'}</b><small>{service?.name ?? 'Serviço'} · {professional?.name ?? 'Profissional'}</small></div>
                <span className="status">{appointment.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
