import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentShop } from '@/lib/navora/current-shop';
import { createProfessionalBlock, deleteProfessionalBlock, saveProfessionalAvailability } from '../actions';

const days = [
  ['Domingo', 0], ['Segunda-feira', 1], ['Terça-feira', 2], ['Quarta-feira', 3],
  ['Quinta-feira', 4], ['Sexta-feira', 5], ['Sábado', 6],
] as const;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ProfessionalAvailabilityPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, membership, barbershop } = await getCurrentShop();
  const canManage = membership.role === 'owner' || membership.role === 'admin';

  const [professionalResult, hoursResult, servicesResult, linksResult, blocksResult] = await Promise.all([
    supabase.from('professionals').select('id, name, specialty, active, uses_business_hours').eq('id', id).eq('barbershop_id', barbershop.id).maybeSingle(),
    supabase.from('professional_hours').select('day_of_week, is_working, starts_at, ends_at').eq('professional_id', id).eq('barbershop_id', barbershop.id).order('day_of_week'),
    supabase.from('services').select('id, name, duration_min').eq('barbershop_id', barbershop.id).eq('active', true).order('name'),
    supabase.from('professional_services').select('service_id').eq('professional_id', id).eq('barbershop_id', barbershop.id),
    supabase.from('professional_blocks').select('id, starts_at, ends_at, reason').eq('professional_id', id).eq('barbershop_id', barbershop.id).gte('ends_at', new Date().toISOString()).order('starts_at'),
  ]);

  const professional = professionalResult.data;
  if (!professional) notFound();
  const hoursByDay = new Map((hoursResult.data ?? []).map((item) => [item.day_of_week, item]));
  const selectedServices = new Set((linksResult.data ?? []).map((item) => item.service_id));
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: barbershop.timezone,
  });

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="profissionais">
      <div className="dashhead professional-config-head"><div><div className="eyebrow">DISPONIBILIDADE</div><h1>{professional.name}</h1><p>{professional.specialty || 'Configure os serviços e a agenda deste profissional.'}</p></div><Link className="secondary-link" href="/dashboard/profissionais">Voltar para equipe</Link></div>

      {query.error && <div className="auth-alert error settings-alert">{query.error}</div>}
      {query.success && <div className="auth-alert success-message settings-alert">{query.success}</div>}

      <form action={saveProfessionalAvailability} className="settings-form professional-settings-form">
        <input type="hidden" name="professionalId" value={professional.id} />
        <section className="section-card settings-section">
          <div className="section-head"><div><h2>Regra de horário</h2><p className="caption">O horário da barbearia sempre será o limite máximo de funcionamento.</p></div></div>
          <label className="toggle-setting professional-inherit-toggle"><span><b>Usar horário geral da barbearia</b><small>Quando ativo, mudanças no horário geral também valem para este profissional.</small></span><input type="checkbox" name="usesBusinessHours" defaultChecked={professional.uses_business_hours} disabled={!canManage} /></label>
        </section>

        <section className="section-card settings-section">
          <div className="section-head"><div><h2>Horário individual</h2><p className="caption">Usado quando a opção de horário geral estiver desativada.</p></div></div>
          <div className="business-hours-list">
            {days.map(([label, day]) => {
              const item = hoursByDay.get(day);
              const working = item?.is_working ?? day !== 0;
              return <div className="business-hour-row" key={day}><label className="day-toggle"><input type="checkbox" name={`day-${day}-working`} defaultChecked={working} disabled={!canManage} /><span>{label}</span></label><div className="hour-range"><input type="time" name={`day-${day}-starts`} defaultValue={item?.starts_at?.slice(0, 5) ?? '09:00'} disabled={!canManage} /><span>até</span><input type="time" name={`day-${day}-ends`} defaultValue={item?.ends_at?.slice(0, 5) ?? '19:00'} disabled={!canManage} /></div></div>;
            })}
          </div>
        </section>

        <section className="section-card settings-section">
          <div className="section-head"><div><h2>Serviços atendidos</h2><p className="caption">Somente os serviços marcados aparecerão para este profissional na agenda.</p></div></div>
          <div className="professional-service-grid">
            {(servicesResult.data ?? []).map((service) => <label className="service-check" key={service.id}><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={selectedServices.has(service.id)} disabled={!canManage} /><span><b>{service.name}</b><small>{service.duration_min} min</small></span></label>)}
            {(servicesResult.data ?? []).length === 0 && <p className="empty-state compact">Cadastre serviços antes de configurar os atendimentos.</p>}
          </div>
        </section>

        {canManage ? <div className="settings-save"><button className="button" type="submit">Salvar disponibilidade</button></div> : <p className="caption">Seu perfil possui acesso somente de leitura.</p>}
      </form>

      <div className="professional-blocks-grid">
        <section className="section-card settings-section">
          <div className="section-head"><div><h2>Nova folga ou bloqueio</h2><p className="caption">Reserve férias, almoço, compromisso ou qualquer período indisponível.</p></div></div>
          {canManage ? <form action={createProfessionalBlock} className="admin-form block-form"><input type="hidden" name="professionalId" value={professional.id} /><label>Início<input type="datetime-local" name="startsLocal" required /></label><label>Fim<input type="datetime-local" name="endsLocal" required /></label><label>Motivo<input name="reason" placeholder="Ex.: Folga, almoço ou férias" /></label><button className="button full" type="submit">Adicionar bloqueio</button></form> : <p className="empty-state compact">Somente proprietários e administradores podem criar bloqueios.</p>}
        </section>

        <section className="section-card settings-section">
          <div className="section-head"><div><h2>Próximos bloqueios</h2><p className="caption">{blocksResult.data?.length ?? 0} período(s) programado(s)</p></div></div>
          <div className="block-list">
            {(blocksResult.data ?? []).length === 0 && <p className="empty-state">Nenhum bloqueio futuro.</p>}
            {(blocksResult.data ?? []).map((block) => <div className="block-row" key={block.id}><div><b>{block.reason || 'Indisponível'}</b><small>{formatter.format(new Date(block.starts_at))} — {formatter.format(new Date(block.ends_at))}</small></div>{canManage && <form action={deleteProfessionalBlock}><input type="hidden" name="professionalId" value={professional.id} /><input type="hidden" name="blockId" value={block.id} /><button type="submit">Remover</button></form>}</div>)}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
