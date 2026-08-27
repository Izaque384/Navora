'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setChecking(false);
      }
    });

    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionReady(Boolean(session));
      setChecking(false);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase.auth]);

  async function handleReset() {
    setError('');
    setMessage('');
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.');
    if (password !== confirm) return setError('As senhas não coincidem.');

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage('Senha redefinida com sucesso.');
    setTimeout(() => router.push('/dashboard'), 1500);
    setLoading(false);
  }

  return (
    <main className="auth-shell auth-shell-fotura-style">
      <section className="auth-panel auth-panel-compact">
        <div className="auth-brand-centered"><img src="/navora-mark.svg" alt="" width="34" height="34" /><span>NAVORA</span></div>
        <p className="auth-subtitle">{checking ? 'Verificando link de recuperação…' : 'Defina sua nova senha'}</p>

        {!checking && !sessionReady && (
          <>
            <p className="auth-feedback error">Link inválido ou expirado.</p>
            <p className="auth-switch-copy"><Link href="/esqueci-senha">Solicitar novo link</Link></p>
          </>
        )}

        {!checking && sessionReady && !message && (
          <>
            <label className="auth-field-label" htmlFor="password">Nova senha</label>
            <input id="password" className="auth-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="new-password" />
            <label className="auth-field-label" htmlFor="confirm">Confirmar nova senha</label>
            <input id="confirm" className="auth-input" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleReset()} placeholder="••••••••" autoComplete="new-password" />
            <button className="auth-submit-button" onClick={handleReset} disabled={loading}>{loading ? 'Salvando...' : 'Redefinir senha'}</button>
            {error && <p className="auth-feedback error">{error}</p>}
          </>
        )}

        {message && <div className="auth-alert success-message">{message} Redirecionando…</div>}
      </section>
    </main>
  );
}
