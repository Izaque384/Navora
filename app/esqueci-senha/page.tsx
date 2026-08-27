'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (resetError) {
      const friendly = resetError.message.toLowerCase().includes('rate limit')
        ? 'O limite de e-mails de recuperação foi atingido. Tente novamente em alguns minutos.'
        : resetError.message;
      setError(friendly);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  return (
    <main className="auth-shell auth-shell-fotura-style">
      <section className="auth-panel auth-panel-compact">
        <div className="auth-brand-centered"><img src="/navora-mark.svg" alt="" width="34" height="34" /><span>NAVORA</span></div>
        <p className="auth-subtitle">Recuperação de senha</p>

        {sent ? (
          <>
            <div className="auth-alert success-message">E-mail enviado. Verifique sua caixa de entrada e o spam para redefinir sua senha.</div>
            <p className="auth-switch-copy"><Link href="/login">Voltar ao login</Link></p>
          </>
        ) : (
          <>
            <label className="auth-field-label" htmlFor="email">E-mail da sua conta</label>
            <input id="email" className="auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSubmit()} placeholder="seu@email.com" autoComplete="email" />
            <button className="auth-submit-button" onClick={handleSubmit} disabled={loading}>{loading ? 'Enviando...' : 'Enviar link de recuperação'}</button>
            {error && <p className="auth-feedback error">{error}</p>}
            <p className="auth-switch-copy"><Link href="/login">Voltar ao login</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
