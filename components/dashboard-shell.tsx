import Link from 'next/link';
import type { ReactNode } from 'react';

type DashboardShellProps = {
  shopName: string;
  role: string;
  active: 'overview' | 'agenda' | 'clientes' | 'servicos' | 'profissionais' | 'configuracoes';
  children: ReactNode;
};

const items = [
  ['overview', '/dashboard', 'Visão geral'],
  ['agenda', '/dashboard/agenda', 'Agenda'],
  ['clientes', '/dashboard/clientes', 'Clientes'],
  ['servicos', '/dashboard/servicos', 'Serviços'],
  ['profissionais', '/dashboard/profissionais', 'Profissionais'],
  ['configuracoes', '/dashboard/configuracoes', 'Configurações'],
] as const;

export function DashboardShell({ shopName, role, active, children }: DashboardShellProps) {
  return (
    <main className="dashboard dashboard-route">
      <aside className="nav">
        <Link className="nav-brand" href="/dashboard">
          <img src="/navora-mark.svg" alt="" width="28" height="28" />
          <span>NAVORA</span>
        </Link>
        <nav>
          {items.map(([key, href, label]) => (
            <Link className={active === key ? 'active' : undefined} href={href} key={key}>
              {label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="profile">
          <div><b>{shopName}</b><small>{role}</small></div>
          <button type="submit">Sair</button>
        </form>
      </aside>
      <section className="panel">{children}</section>
    </main>
  );
}
