import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <article className="legal-card">
        <h1>Política de Privacidade</h1>
        <p>Versão inicial para o MVP do Navora. Antes do lançamento comercial, este documento deve passar por revisão jurídica e adequação completa à LGPD.</p>
        <h2>Dados tratados</h2>
        <p>O Navora pode armazenar dados de conta, informações da barbearia e dados cadastrados de clientes, serviços, profissionais e agendamentos.</p>
        <h2>Finalidade</h2>
        <p>Os dados são utilizados para autenticação, funcionamento da agenda, organização operacional e exibição das informações da própria barbearia.</p>
        <h2>Segurança</h2>
        <p>O acesso aos dados da aplicação é protegido por autenticação e políticas de isolamento entre barbearias no banco de dados.</p>
        <h2>Direitos e solicitações</h2>
        <p>O fluxo definitivo para solicitações de acesso, correção e exclusão será formalizado antes do lançamento público do serviço.</p>
        <p><Link href="/login">Voltar ao login</Link></p>
      </article>
    </main>
  );
}
