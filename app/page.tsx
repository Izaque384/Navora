import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Navora - início">
          <img src="/navora-mark.svg" alt="" aria-hidden="true" />
          <span>NAVORA</span>
        </Link>
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.login}>Entrar</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.badge}>GESTÃO E AGENDA PARA BARBEARIAS</div>
        <h1>
          Sua barbearia mais <span>organizada.</span><br />Seu dia mais leve.
        </h1>
        <p className={styles.lead}>
          Centralize agenda, clientes, equipe e serviços em um só lugar. Menos improviso na rotina, mais tempo para atender bem.
        </p>
        <div className={styles.ctas}>
          <Link href="/login" className={styles.primary}>Começar agora</Link>
          <Link href="/login" className={styles.secondary}>Já tenho conta</Link>
        </div>
      </section>

      <section className={styles.steps} aria-label="Como funciona">
        <article className={styles.step}>
          <div className={styles.number}>1</div>
          <h2>Configure sua operação</h2>
          <p>Cadastre serviços, duração, valores e profissionais da sua barbearia.</p>
        </article>
        <article className={styles.step}>
          <div className={styles.number}>2</div>
          <h2>Organize sua agenda</h2>
          <p>Visualize horários, clientes e profissionais sem perder tempo com controles espalhados.</p>
        </article>
        <article className={styles.step}>
          <div className={styles.number}>3</div>
          <h2>Acompanhe o negócio</h2>
          <p>Tenha uma visão clara da rotina, próximos atendimentos e movimentação da barbearia.</p>
        </article>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresLabel}>FEITO PARA A ROTINA REAL</div>
        <h2>As ferramentas certas, sem complicar o seu atendimento.</h2>
        <div className={styles.featureGrid}>
          <article className={styles.feature}>
            <strong>Agenda centralizada</strong>
            <span>Horários, clientes, serviços e profissionais reunidos em uma única visão.</span>
          </article>
          <article className={styles.feature}>
            <strong>Gestão de clientes</strong>
            <span>Mantenha contatos e histórico organizados para tornar o atendimento mais consistente.</span>
          </article>
          <article className={styles.feature}>
            <strong>Equipe e serviços</strong>
            <span>Estruture sua operação com profissionais ativos, especialidades, duração e preços.</span>
          </article>
        </div>
      </section>

      <section className={styles.bottomCta}>
        <h2>Uma agenda que acompanha o seu estilo.</h2>
        <p>Comece a organizar sua barbearia com o Navora.</p>
        <Link href="/login" className={styles.primary}>Criar minha conta</Link>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 Navora</span>
        <div className={styles.footerLinks}>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/privacidade">Política de Privacidade</Link>
          <Link href="/login">Entrar</Link>
        </div>
      </footer>
    </main>
  );
}
