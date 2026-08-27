'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit() {
    setMessage('');

    if (!email.trim() || !password) {
      setMessage('Erro: preencha e-mail e senha.');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      setMessage('Erro: informe seu nome completo.');
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setMessage('Erro: a senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    if (mode === 'signup' && !acceptedTerms) {
      setMessage('Erro: você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            accepted_terms_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        const friendly = error.message.toLowerCase().includes('rate limit')
          ? 'Não foi possível concluir o cadastro agora. Tente novamente em alguns minutos.'
          : error.message;
        setMessage(`Erro: ${friendly}`);
      } else if (data.session) {
        router.push('/onboarding');
        router.refresh();
        return;
      } else {
        setMessage('Conta criada com sucesso.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage('Erro: e-mail ou senha inválidos.');
      } else {
        router.push('/dashboard');
        router.refresh();
        return;
      }
    }

    setLoading(false);
  }

  function toggleMode() {
    setMode((current) => (current === 'login' ? 'signup' : 'login'));
    setMessage('');
    setAcceptedTerms(false);
  }

  return (
    <main className="auth-shell auth-shell-fotura-style">
      <section className="auth-panel auth-panel-compact">
        <div className="auth-brand-centered">
          <img src="/navora-mark.svg" alt="" width="34" height="34" />
          <span>NAVORA</span>
        </div>
        <p className="auth-subtitle">{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</p>

        {mode === 'signup' && (
          <>
            <label className="auth-field-label" htmlFor="fullName">Nome completo</label>
            <input
              id="fullName"
              className="auth-input"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
          </>
        )}

        <label className="auth-field-label" htmlFor="email">E-mail</label>
        <input
          id="email"
          className="auth-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
        />

        <label className="auth-field-label" htmlFor="password">Senha</label>
        <input
          id="password"
          className="auth-input auth-input-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
          placeholder="••••••••"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {mode === 'login' && (
          <div className="auth-forgot-row">
            <Link href="/esqueci-senha">Esqueci minha senha</Link>
          </div>
        )}

        {mode === 'signup' && (
          <label className="auth-terms-row">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Li e aceito os <Link href="/termos" target="_blank">Termos de Uso</Link> e a{' '}
              <Link href="/privacidade" target="_blank">Política de Privacidade</Link>.
            </span>
          </label>
        )}

        <button className="auth-submit-button" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        {message && (
          <p className={`auth-feedback ${message.startsWith('Erro') ? 'error' : 'success'}`}>{message}</p>
        )}

        <p className="auth-switch-copy">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button type="button" onClick={toggleMode}>
            {mode === 'login' ? 'Cadastre-se' : 'Fazer login'}
          </button>
        </p>
      </section>
    </main>
  );
}
