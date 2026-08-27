import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentShop } from '@/lib/navora/current-shop';
import { createProfessional } from '../actions';

export default async function ProfessionalsPage() {
  const { supabase, membership, barbershop } = await getCurrentShop();
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name, specialty, active, created_at')
    .eq('barbershop_id', barbershop.id)
    .order('active', { ascending: false })
    .order('name');

  async function submitProfessional(formData: FormData) {
    'use server';
    await createProfessional(formData);
  }

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="profissionais">
      <div className="dashhead"><div><div className="eyebrow">EQUIPE</div><h1>Profissionais</h1><p>Monte a equipe que poderá receber agendamentos no Navora.</p></div></div>
      <div className="management-grid">
        <section className="section-card form-card">
          <div className="section-head"><div><h2>Novo profissional</h2><p className="caption">O profissional ficará disponível para a agenda.</p></div></div>
          <form action={submitProfessional} className="admin-form">
            <label>Nome<input name="name" required placeholder="Ex.: Lucas Mendes" /></label>
            <label>Especialidade<input name="specialty" placeholder="Ex.: Corte e barba" /></label>
            <button className="button full" type="submit">Adicionar profissional</button>
          </form>
        </section>
        <section className="section-card list-card">
          <div className="section-head"><div><h2>Equipe cadastrada</h2><p className="caption">{professionals?.length ?? 0} profissional(is)</p></div></div>
          <div className="data-list">
            {(professionals ?? []).length === 0 && <p className="empty-state">Nenhum profissional cadastrado.</p>}
            {(professionals ?? []).map((professional) => (
              <div className="data-row" key={professional.id}>
                <div className="person-line"><span className="profile-mini">{professional.name.slice(0, 2).toUpperCase()}</span><div><b>{professional.name}</b><small>{professional.specialty || 'Sem especialidade definida'}</small></div></div>
                <span className={`status ${professional.active ? 'is-active' : ''}`}>{professional.active ? 'Ativo' : 'Inativo'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
