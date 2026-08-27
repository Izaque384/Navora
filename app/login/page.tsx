import { login, signup } from './actions';

type LoginPageProps = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand"><img src="/navora-mark.svg" alt="" width="42" height="42" /><span>NAVORA</span></div>
        <div className="auth-copy"><div className="eyebrow">GESTÃO PARA BARBEARIAS</div><h1>Entre no seu espaço.</h1><p>Agenda, clientes, equipe e operação da sua barbearia em um só lugar.</p></div>
        {params.error && <div className="auth-alert error">{params.error}</div>}
        {params.message && <div className="auth-alert success-message">{params.message}</div>}
        <form className="auth-form">
          <label htmlFor="fullName">Nome completo <span>apenas para cadastro</span></label>
          <input id="fullName" name="fullName" type="text" placeholder="Seu nome" autoComplete="name" />
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" placeholder="voce@barbearia.com" autoComplete="email" required />
          <label htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" placeholder="Mínimo de 8 caracteres" autoComplete="current-password" required />
          <div className="auth-actions"><button className="button" formAction={login}>Entrar</button><button className="button secondary" formAction={signup}>Criar conta</button></div>
        </form>
      </section>
    </main>
  );
}
