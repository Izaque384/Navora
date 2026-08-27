import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentShop } from '@/lib/navora/current-shop';
import { saveSettings } from './actions';

const days = [
  ['Domingo', 0],
  ['Segunda-feira', 1],
  ['Terça-feira', 2],
  ['Quarta-feira', 3],
  ['Quinta-feira', 4],
  ['Sexta-feira', 5],
  ['Sábado', 6],
] as const;

type SettingsPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const { supabase, membership, barbershop } = await getCurrentShop();

  const [{ data: shop }, { data: hours }] = await Promise.all([
    supabase
      .from('barbershops')
      .select('id, name, slug, phone, address, timezone, slot_interval_min, public_booking_enabled')
      .eq('id', barbershop.id)
      .single(),
    supabase
      .from('business_hours')
      .select('day_of_week, is_open, opens_at, closes_at')
      .eq('barbershop_id', barbershop.id)
      .order('day_of_week'),
  ]);

  const byDay = new Map((hours ?? []).map((item) => [item.day_of_week, item]));
  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="configuracoes">
      <div className="dashhead settings-head">
        <div>
          <div className="eyebrow">CONFIGURAÇÕES</div>
          <h1>Barbearia</h1>
          <p>Defina os dados públicos e as regras que serão usadas pela agenda do Navora.</p>
        </div>
      </div>

      {params.error && <div className="auth-alert error settings-alert">{params.error}</div>}
      {params.success && <div className="auth-alert success-message settings-alert">{params.success}</div>}

      <form action={saveSettings} className="settings-form">
        <section className="section-card settings-section">
          <div className="section-head">
            <div><h2>Informações da barbearia</h2><p className="caption">Dados usados no painel e futuramente na página pública de agendamento.</p></div>
          </div>

          <div className="settings-fields two-columns">
            <label>Nome da barbearia<input name="name" defaultValue={shop?.name ?? barbershop.name} required disabled={!canEdit} /></label>
            <label>Telefone / WhatsApp<input name="phone" defaultValue={shop?.phone ?? ''} placeholder="(00) 00000-0000" disabled={!canEdit} /></label>
          </div>

          <label className="settings-label">Endereço<input name="address" defaultValue={shop?.address ?? ''} placeholder="Rua, número, bairro e cidade" disabled={!canEdit} /></label>

          <div className="settings-fields two-columns">
            <label>Link público<div className="slug-field"><span>/b/</span><input name="slug" defaultValue={shop?.slug ?? barbershop.slug} required disabled={!canEdit} /></div></label>
            <label>Fuso horário<select name="timezone" defaultValue={shop?.timezone ?? 'America/Sao_Paulo'} disabled={!canEdit}><option value="America/Sao_Paulo">Brasília / São Paulo</option><option value="America/Manaus">Manaus</option><option value="America/Cuiaba">Cuiabá</option><option value="America/Rio_Branco">Rio Branco</option><option value="America/Noronha">Fernando de Noronha</option></select></label>
          </div>
        </section>

        <section className="section-card settings-section">
          <div className="section-head">
            <div><h2>Regras da agenda</h2><p className="caption">Essas regras servirão de base para calcular os horários disponíveis.</p></div>
          </div>

          <div className="settings-fields two-columns">
            <label>Intervalo da grade<select name="slotIntervalMin" defaultValue={String(shop?.slot_interval_min ?? 15)} disabled={!canEdit}><option value="5">5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="20">20 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option></select></label>
            <label className="toggle-setting"><span><b>Agendamento público</b><small>Permitir que clientes usem o link público para marcar horários.</small></span><input type="checkbox" name="publicBookingEnabled" defaultChecked={shop?.public_booking_enabled ?? true} disabled={!canEdit} /></label>
          </div>
        </section>

        <section className="section-card settings-section">
          <div className="section-head">
            <div><h2>Horário de funcionamento</h2><p className="caption">Feche dias sem atendimento e defina abertura e encerramento de cada dia.</p></div>
          </div>

          <div className="business-hours-list">
            {days.map(([label, day]) => {
              const item = byDay.get(day);
              const open = item?.is_open ?? day !== 0;
              const opens = item?.opens_at?.slice(0, 5) ?? '09:00';
              const closes = item?.closes_at?.slice(0, 5) ?? '19:00';
              return (
                <div className="business-hour-row" key={day}>
                  <label className="day-toggle"><input type="checkbox" name={`day-${day}-open`} defaultChecked={open} disabled={!canEdit} /><span>{label}</span></label>
                  <div className="hour-range"><input type="time" name={`day-${day}-opens`} defaultValue={opens} disabled={!canEdit} /><span>até</span><input type="time" name={`day-${day}-closes`} defaultValue={closes} disabled={!canEdit} /></div>
                </div>
              );
            })}
          </div>
        </section>

        {canEdit ? <div className="settings-save"><button className="button" type="submit">Salvar configurações</button></div> : <p className="caption">Seu perfil possui acesso somente de leitura a estas configurações.</p>}
      </form>
    </DashboardShell>
  );
}
