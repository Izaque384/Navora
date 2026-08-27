import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <article className="legal-card">
        <h1>Termos de Uso</h1>
        <p>Versão inicial dos termos do Navora para uso durante o MVP. Este texto não substitui revisão jurídica antes do lançamento comercial.</p>
        <h2>Uso da plataforma</h2>
        <p>O Navora oferece ferramentas de gestão para barbearias, incluindo agenda, clientes, serviços e profissionais. O usuário é responsável pelas informações cadastradas e pelo uso adequado da conta.</p>
        <h2>Conta e segurança</h2>
        <p>O acesso é pessoal. O usuário deve manter suas credenciais seguras e comunicar qualquer uso indevido assim que identificado.</p>
        <h2>Dados cadastrados</h2>
        <p>O responsável pela barbearia deve possuir base legítima para cadastrar e utilizar informações de clientes e profissionais.</p>
        <h2>Disponibilidade</h2>
        <p>Durante a fase de desenvolvimento, funcionalidades podem ser modificadas, interrompidas ou aprimoradas sem aviso prévio.</p>
        <p><Link href="/login">Voltar ao login</Link></p>
      </article>
    </main>
  );
}
