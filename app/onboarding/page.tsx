import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createBarbershop } from './actions';

type OnboardingPageProps = { searchParams: Promise<{ error?: string }> };

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect('/login');

  const { data: membership } = await supabase
    .from('barbershop_members')
    .select('barbershop_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (membership) redirect('/dashboard');

  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand"><img src="/navora-mark.svg" alt="" width="42" height="42" /><span>NAVORA</span></div>
        <div className="auth-copy"><div className="eyebrow">PRIMEIROS PASSOS</div><h1>Configure sua barbearia.</h1><p>Crie o espaço da sua equipe. Você será registrado automaticamente como proprietário.</p></div>
        {params.error && <div className="auth-alert error">{params.error}</div>}
        <form className="auth-form" action={createBarbershop}>
          <label htmlFor="name">Nome da barbearia</label>
          <input id="name" name="name" type="text" placeholder="Ex.: Barbearia Elite" required />
          <label htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" type="tel" placeholder="(00) 00000-0000" />
          <label htmlFor="address">Endereço</label>
          <input id="address" name="address" type="text" placeholder="Rua, número, cidade" />
          <button className="button full" type="submit">Criar minha barbearia</button>
        </form>
      </section>
    </main>
  );
}
