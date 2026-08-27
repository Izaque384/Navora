import { DashboardShell } from '@/components/dashboard-shell';
import { getCurrentShop } from '@/lib/navora/current-shop';
import { createCustomer } from '../actions';

export default async function CustomersPage() {
  const { supabase, membership, barbershop } = await getCurrentShop();
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, email, created_at')
    .eq('barbershop_id', barbershop.id)
    .order('created_at', { ascending: false });

  return (
    <DashboardShell shopName={barbershop.name} role={membership.role} active="clientes">
      <div className="dashhead"><div><div className="eyebrow">RELACIONAMENTO</div><h1>Clientes</h1><p>Centralize os contatos usados nos agendamentos da barbearia.</p></div></div>
      <div className="management-grid">
        <section className="section-card form-card">
          <div className="section-head"><div><h2>Novo cliente</h2><p className="caption">Telefone e nome são obrigatórios.</p></div></div>
          <form action={createCustomer} className="admin-form">
            <label>Nome<input name="name" required placeholder="Nome completo" /></label>
            <label>WhatsApp<input name="phone" required placeholder="(00) 00000-0000" /></label>
            <label>E-mail<input name="email" type="email" placeholder="cliente@email.com" /></label>
            <button className="button full" type="submit">Adicionar cliente</button>
          </form>
        </section>
        <section className="section-card list-card">
          <div className="section-head"><div><h2>Base de clientes</h2><p className="caption">{customers?.length ?? 0} cliente(s)</p></div></div>
          <div className="data-list">
            {(customers ?? []).length === 0 && <p className="empty-state">Nenhum cliente cadastrado.</p>}
            {(customers ?? []).map((customer) => (
              <div className="data-row" key={customer.id}>
                <div className="person-line"><span className="profile-mini">{customer.name.slice(0, 2).toUpperCase()}</span><div><b>{customer.name}</b><small>{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</small></div></div>
                <small>{new Date(customer.created_at).toLocaleDateString('pt-BR')}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
