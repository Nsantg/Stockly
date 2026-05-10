'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Credenciales incorrectas. Verifique su email y contraseña.');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── LEFT PANEL — branding ─────────────────────────────────── */}
      <div className="relative lg:w-[44%] bg-brand-500 flex flex-col p-8 lg:p-12 overflow-hidden min-h-[260px] lg:min-h-screen">

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent-500/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl pointer-events-none" />

        {/* Back button */}
        <Link
          href="/"
          className="relative z-10 inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 w-fit"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver al inicio
        </Link>

        {/* Brand content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center py-10 lg:py-0">
          <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 mb-6 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-white/80" />
              <div className="h-2.5 w-2.5 rounded-sm bg-white/40" />
              <div className="h-2.5 w-2.5 rounded-sm bg-white/40" />
              <div className="h-2.5 w-2.5 rounded-sm bg-accent-400/80" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Stockly</h1>
          <p className="mt-2.5 text-sm text-white/55 max-w-[220px] leading-relaxed">
            Sistema de gestión de inventario para equipos profesionales
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/25 text-center lg:text-left">
          Stockly &copy; {new Date().getFullYear()}
        </p>

        {/* Wave divider — desktop only */}
        <div className="hidden lg:block absolute right-0 top-0 h-full w-20 z-10">
          <svg
            viewBox="0 0 80 900"
            className="h-full w-full"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 80 0 C 52 90, 72 180, 44 270 C 18 350, 66 430, 36 520 C 10 595, 62 670, 32 755 C 14 810, 58 860, 80 900 L 80 0 Z"
              fill="#F5F4F0"
            />
          </svg>
        </div>
      </div>

      {/* ─── RIGHT PANEL — form ────────────────────────────────────── */}
      <div className="flex-1 bg-surface flex items-center justify-center px-8 py-14 lg:px-16">
        <div className="w-full max-w-sm animate-fade-in-up">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink">Bienvenido de nuevo</h2>
            <p className="text-sm text-muted mt-1.5">Ingresa tus credenciales para acceder</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>

            {error && (
              <div
                key={error}
                className="animate-shake rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-ink uppercase tracking-wider"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder-muted/50 transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-ink uppercase tracking-wider"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder-muted/50 transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
