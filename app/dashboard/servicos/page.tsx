import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentShop } from '@/lib/navora/current-shop';
import { createService } from '../actions';

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default async function ServicesPage() {
  const { supabase, membership, barbershop } = await getCurrentShop();
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_min, price, active')
    .eq('barbershop_id', barbershop.id)
    .order('active', { ascending: false })
    .order('name');

  async function submitService(formData: FormData) {
    'use server';
    await createService(formData);
  }

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="servicos">
      <div className="dashhead"><div><div className="eyebrow">CATÁLOGO</div><h1>Serviços</h1><p>Cadastre o que sua barbearia oferece, com duração e preço reais.</p></div></div>
      <div className="management-grid">
        <section className="section-card form-card">
          <div className="section-head"><div><h2>Novo serviço</h2><p className="caption">Esses dados serão usados na agenda.</p></div></div>
          <form action={submitService} className="admin-form">
            <label>Nome<input name="name" required placeholder="Ex.: Corte clássico" /></label>
            <label>Descrição<textarea name="description" rows={3} placeholder="Detalhes opcionais" /></label>
            <div className="form-row">
              <label>Duração (min)<input name="durationMin" type="number" min="5" step="5" required defaultValue="45" /></label>
              <label>Preço (R$)<input name="price" type="number" min="0" step="0.01" required placeholder="45,00" /></label>
            </div>
            <button className="button full" type="submit">Adicionar serviço</button>
          </form>
        </section>
        <section className="section-card list-card">
          <div className="section-head"><div><h2>Serviços cadastrados</h2><p className="caption">{services?.length ?? 0} item(ns)</p></div></div>
          <div className="data-list">
            {(services ?? []).length === 0 && <p className="empty-state">Nenhum serviço cadastrado.</p>}
            {(services ?? []).map((service) => (
              <div className="data-row" key={service.id}>
                <div><b>{service.name}</b><small>{service.description || 'Sem descrição'} · {service.duration_min} min</small></div>
                <div className="row-meta"><strong>{money(Number(service.price))}</strong><span className={`status ${service.active ? 'is-active' : ''}`}>{service.active ? 'Ativo' : 'Inativo'}</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
