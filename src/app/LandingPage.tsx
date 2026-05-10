'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const CYCLING_WORDS = [
  { phrase: 'tu inventario' },
  { phrase: 'tus productos' },
  { phrase: 'tus despachos' },
];

const features = [
  {
    label: '01',
    title: 'Control total de stock',
    description:
      'Registra entradas, salidas y ajustes al instante. Nunca pierdas el rastro de tus existencias.',
  },
  {
    label: '02',
    title: 'Roles diferenciados',
    description:
      'Permisos precisos para cada integrante del equipo: Admin, Almacenista, Despachador o Visualizador.',
  },
  {
    label: '03',
    title: 'Despachos trazables',
    description:
      'Seguimiento completo desde el almacén hasta la entrega. Cada movimiento queda registrado.',
  },
  {
    label: '04',
    title: 'Visibilidad inmediata',
    description:
      'Consulta el estado de tu operación desde cualquier dispositivo, en cualquier momento.',
  },
];

const modules = [
  {
    name: 'Inventario',
    description: 'Control de stock, entradas y salidas en tiempo real.',
    progress: 65,
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 7.5L10 3l8 4.5v7L10 19l-8-4.5v-7z"/>
        <path d="M10 3v16"/>
        <path d="M2 7.5l8 4.5 8-4.5"/>
      </svg>
    ),
  },
  {
    name: 'Productos',
    description: 'Catálogo de referencias, variantes y unidades de medida.',
    progress: 40,
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h14v4H3z"/>
        <path d="M3 9h14v8H3z"/>
        <path d="M7 13h6"/>
      </svg>
    ),
  },
  {
    name: 'Despachos',
    description: 'Órdenes de salida, seguimiento y confirmación de entrega.',
    progress: 25,
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="6" width="11" height="9" rx="1"/>
        <path d="M12 9h4l2 3v3h-6"/>
        <circle cx="5" cy="17" r="1.5"/>
        <circle cx="15" cy="17" r="1.5"/>
      </svg>
    ),
  },
];

const roles = [
  {
    name: 'Admin',
    note: 'Acceso completo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L3 5v5c0 4.4 3.1 8.1 7 9 3.9-.9 7-4.6 7-9V5l-7-3z"/>
      </svg>
    ),
  },
  {
    name: 'Almacenista',
    note: 'Gestión de stock',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8.5L10 4l8 4.5V17H2V8.5z"/>
        <path d="M7 17v-5h6v5"/>
      </svg>
    ),
  },
  {
    name: 'Despachador',
    note: 'Órdenes de salida',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10H3"/>
        <path d="M12 5l5 5-5 5"/>
      </svg>
    ),
  },
  {
    name: 'Visualizador',
    note: 'Solo lectura',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 10s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/>
        <circle cx="10" cy="10" r="2.5"/>
      </svg>
    ),
  },
];

export default function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  const featuresSection = useInView();
  const modulesSection = useInView();
  const rolesSection = useInView();
  const ctaSection = useInView(0.3);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % CYCLING_WORDS.length);
        setWordVisible(true);
      }, 280);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const ctaHref = isLoggedIn ? '/dashboard' : '/login';
  const ctaLabel = isLoggedIn ? 'Ir al panel' : 'Iniciar sesión';

  return (
    <div className="min-h-screen bg-surface text-ink overflow-x-hidden">

      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(circle, #1B3B6F0A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md border-b border-line/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-brand-500">Stockly</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted">
            <a href="#funcionalidades" className="hover:text-ink transition-colors duration-150">
              Funcionalidades
            </a>
            <a href="#modulos" className="hover:text-ink transition-colors duration-150">
              Módulos
            </a>
          </nav>
          <Link
            href={ctaHref}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
          >
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36 text-center">

        {/* Glow blobs */}
        <div className="absolute top-16 right-1/3 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-8 left-1/3 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-muted mb-8 shadow-card-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse" />
            Plataforma de inventario para equipos profesionales
          </div>

          <h1 className="animate-fade-in-up animation-delay-80 text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight text-ink leading-[1.1] mb-6">
            Controla{' '}
            <span
              className="text-brand-500 inline-block transition-all duration-[280ms]"
              style={{
                opacity: wordVisible ? 1 : 0,
                transform: wordVisible ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              {CYCLING_WORDS[wordIndex].phrase}
            </span>
            <br />
            con precisión.
          </h1>

          <p className="animate-fade-in-up animation-delay-160 text-base sm:text-lg text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Stockly centraliza la gestión de stock, productos y despachos en una sola plataforma.
            Diseñado para equipos que necesitan claridad y control.
          </p>

          <div className="animate-fade-in-up animation-delay-240 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="w-full sm:w-auto rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {ctaLabel}
            </Link>
            <a
              href="#modulos"
              className="w-full sm:w-auto rounded-xl border border-line bg-white px-8 py-3.5 text-sm font-semibold text-ink transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500 hover:-translate-y-0.5"
            >
              Ver módulos
            </a>
          </div>
        </div>

        {/* Dashboard preview strip */}
        <div className="animate-fade-in-up animation-delay-240 mt-16 relative max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white border border-line shadow-card overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line bg-subtle">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <span className="ml-3 text-xs text-muted">stockly — panel</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 rounded-full bg-brand-100" />
                <div className="h-5 w-16 rounded-full bg-accent-100" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {['', '', ''].map((_, i) => (
                  <div key={i} className="rounded-xl bg-subtle h-14" />
                ))}
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-2 w-full rounded-full bg-subtle" />
                <div className="h-2 w-4/5 rounded-full bg-subtle" />
                <div className="h-2 w-3/5 rounded-full bg-subtle" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 bg-brand-500/10 blur-xl rounded-full" />
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="max-w-6xl mx-auto px-6 py-20">
        <div
          ref={featuresSection.ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{ transitionDelay: `${i * 90}ms` }}
              className={`bg-white rounded-2xl p-6 border border-line/60 shadow-card-sm transition-all duration-500 hover:shadow-card hover:border-brand-200 hover:-translate-y-1 cursor-default ${
                featuresSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="text-xs font-bold text-brand-300 tracking-widest">{f.label}</span>
              <h3 className="text-sm font-semibold text-ink mt-3 mb-2">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MODULES ─────────────────────────────────────────────────── */}
      <section id="modulos" className="bg-white border-y border-line py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div ref={modulesSection.ref}>
            <div
              className={`text-center mb-12 transition-all duration-500 ${
                modulesSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Plataforma
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">Módulos en desarrollo</h2>
              <p className="text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
                Cada módulo está diseñado para integrarse y darte visibilidad completa de tu
                operación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {modules.map((mod, i) => (
                <div
                  key={mod.name}
                  style={{ transitionDelay: `${i * 110}ms` }}
                  className={`group relative rounded-2xl border border-line p-7 transition-all duration-500 hover:border-brand-200 hover:shadow-card cursor-default ${
                    modulesSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <span className="absolute top-5 right-5 text-xs font-medium text-accent-600 bg-accent-50 border border-accent-100 px-2.5 py-0.5 rounded-full">
                    En desarrollo
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-brand-50 mb-5 transition-colors duration-200 group-hover:bg-brand-100 flex items-center justify-center text-brand-400 group-hover:text-brand-500">
                    {mod.icon}
                  </div>
                  <h3 className="text-base font-semibold text-ink">{mod.name}</h3>
                  <p className="text-sm text-muted mt-1 mb-5 leading-relaxed">{mod.description}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Progreso</span>
                      <span>{mod.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500/50 transition-all duration-1000 ease-out"
                        style={{
                          width: modulesSection.inView ? `${mod.progress}%` : '0%',
                          transitionDelay: `${400 + i * 150}ms`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROLES ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div ref={rolesSection.ref}>
          <div
            className={`text-center mb-10 transition-all duration-500 ${
              rolesSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              Equipos
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              Un sistema, múltiples roles
            </h2>
            <p className="text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
              Cada persona en tu equipo accede exactamente a lo que necesita, nada más.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {roles.map((role, i) => (
              <div
                key={role.name}
                style={{ transitionDelay: `${i * 80}ms` }}
                className={`group rounded-2xl border border-line bg-white p-5 text-center transition-all duration-500 hover:border-brand-200 hover:shadow-card hover:-translate-y-1 cursor-default ${
                  rolesSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-brand-50 mx-auto mb-3 transition-colors duration-200 group-hover:bg-brand-100 flex items-center justify-center text-brand-400 group-hover:text-brand-500">
                  {role.icon}
                </div>
                <p className="text-sm font-semibold text-ink">{role.name}</p>
                <p className="text-xs text-muted mt-0.5">{role.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          ref={ctaSection.ref}
          className={`relative overflow-hidden rounded-3xl bg-brand-500 px-8 py-16 text-center transition-all duration-700 ${
            ctaSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-accent-500/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl pointer-events-none" />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              ¿Listo para empezar?
            </h2>
            <p className="text-sm text-white/70 max-w-sm mx-auto mb-8 leading-relaxed">
              Accede a tu panel y comienza a gestionar tu inventario hoy mismo.
            </p>
            <Link
              href={ctaHref}
              className="inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-500 transition-all duration-200 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-line bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold tracking-tight text-brand-500">Stockly</span>
          <p className="text-xs text-muted">
            Sistema de Gestión de Inventario &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
