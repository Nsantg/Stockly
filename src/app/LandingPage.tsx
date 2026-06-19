'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

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

function reveal(inView: boolean, hidden = 'opacity-0 translate-y-8') {
  return inView ? 'opacity-100 translate-y-0' : hidden;
}

function useScrollProgress() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 8);
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return { scrolled, progress };
}

function useCountUp(target: number, start: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return value;
}

function useMouseParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobARef = useRef<HTMLDivElement>(null);
  const blobBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (blobARef.current) {
        blobARef.current.style.transform = `translate3d(${x * 36}px, ${y * 36}px, 0)`;
      }
      if (blobBRef.current) {
        blobBRef.current.style.transform = `translate3d(${x * -28}px, ${y * -28}px, 0)`;
      }
    }
    container.addEventListener('mousemove', onMove);
    return () => container.removeEventListener('mousemove', onMove);
  }, []);

  return { containerRef, blobARef, blobBRef };
}

const CYCLING_WORDS = [
  { phrase: 'tu inventario' },
  { phrase: 'tus productos' },
  { phrase: 'tus movimientos' },
];

const HERO_STATS = [
  { label: 'Roles de acceso', value: '4' },
  { label: 'Trazabilidad', value: '100%' },
  { label: 'Disponibilidad', value: '24/7' },
];

function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7.5L10 3l8 4.5v7L10 19l-8-4.5v-7z" />
      <path d="M10 3v16" />
      <path d="M2 7.5l8 4.5 8-4.5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L3 5v5c0 4.4 3.1 8.1 7 9 3.9-.9 7-4.6 7-9V5l-7-3z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5C7.24 2.5 5 4.74 5 7.5v4L3.5 13.5h13L15 11.5v-4c0-2.76-2.24-5-5-5z" strokeLinejoin="round" />
      <path d="M8 16.5c0 1.1.9 2 2 2s2-.9 2-2" />
    </svg>
  );
}

function IconRoute() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 9.5H14" />
      <path d="M10.5 5.5L14.5 9.5L10.5 13.5" />
      <path d="M7.5 5.5L3.5 9.5" />
    </svg>
  );
}

function IconClients() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="3" />
      <path d="M1.5 17c0-3.31 2.46-6 5.5-6s5.5 2.69 5.5 6" />
      <circle cx="14.5" cy="6.5" r="2.4" />
      <path d="M18 17c0-2.21-1.46-4-3.5-4" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3" />
      <path d="M3 17c0-3.5 3-6.5 7-6.5s7 3 7 6.5" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5h7l3 3V17a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z" strokeLinejoin="round" />
      <path d="M7 10h6M7 13h6M7 7h3" />
    </svg>
  );
}

const features = [
  {
    label: '01',
    icon: <IconBox />,
    title: 'Control total de stock',
    description:
      'Registra entradas, salidas y ajustes al instante. Nunca pierdas el rastro de tus existencias.',
  },
  {
    label: '02',
    icon: <IconShield />,
    title: 'Roles diferenciados',
    description:
      'Permisos precisos para cada integrante del equipo: Admin, Almacenista, Despachador o Visualizador.',
  },
  {
    label: '03',
    icon: <IconBell />,
    title: 'Alertas inteligentes',
    description:
      'Notificaciones automáticas cuando un producto baja del umbral mínimo de stock definido.',
  },
  {
    label: '04',
    icon: <IconRoute />,
    title: 'Historial trazable',
    description:
      'Cada movimiento queda registrado con responsable, fecha y motivo. Auditable en cualquier momento.',
  },
];

type ShowcaseRow = { name: string; meta: string; tone: 'ok' | 'warn' | 'down' | 'up' };

type ShowcaseTab = {
  id: string;
  label: string;
  icon: ReactNode;
  heading: string;
  rows: ShowcaseRow[];
};

const showcaseTabs: ShowcaseTab[] = [
  {
    id: 'inventario',
    label: 'Inventario',
    icon: <IconBox />,
    heading: 'Stock por producto',
    rows: [
      { name: 'Banda elástica 1.5m', meta: '128 uds.', tone: 'ok' },
      { name: 'Electrodos TENS x4', meta: '12 uds.', tone: 'warn' },
      { name: 'Gel conductor 250ml', meta: '64 uds.', tone: 'ok' },
      { name: 'Vendaje neuromuscular', meta: '3 uds.', tone: 'down' },
    ],
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    icon: <IconRoute />,
    heading: 'Actividad reciente',
    rows: [
      { name: 'Entrada — Gel conductor', meta: '+40 uds.', tone: 'up' },
      { name: 'Salida — Banda elástica', meta: '-12 uds.', tone: 'down' },
      { name: 'Ajuste — Electrodos TENS', meta: '-4 uds.', tone: 'down' },
      { name: 'Entrada — Vendaje neuromuscular', meta: '+20 uds.', tone: 'up' },
    ],
  },
  {
    id: 'alertas',
    label: 'Alertas',
    icon: <IconBell />,
    heading: 'Stock bajo el mínimo',
    rows: [
      { name: 'Vendaje neuromuscular', meta: 'Crítico', tone: 'down' },
      { name: 'Electrodos TENS x4', meta: 'Bajo', tone: 'warn' },
      { name: 'Cinta kinesiológica', meta: 'Bajo', tone: 'warn' },
      { name: 'Toallas desechables', meta: 'Crítico', tone: 'down' },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <IconClients />,
    heading: 'Clientes activos',
    rows: [
      { name: 'Clínica Vitalis', meta: '18 despachos', tone: 'ok' },
      { name: 'Centro RehabPlus', meta: '11 despachos', tone: 'ok' },
      { name: 'Fisio Norte', meta: '7 despachos', tone: 'ok' },
      { name: 'Consultorio Andes', meta: '4 despachos', tone: 'ok' },
    ],
  },
];

const toneClasses: Record<ShowcaseRow['tone'], string> = {
  ok: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  warn: 'text-accent-700 bg-accent-50 border-accent-100',
  down: 'text-red-700 bg-red-50 border-red-100',
  up: 'text-brand-600 bg-brand-50 border-brand-100',
};

const modules = [
  {
    name: 'Inventario',
    description: 'Catálogo de productos, categorías y control de stock en tiempo real.',
    icon: <IconBox />,
  },
  {
    name: 'Movimientos',
    description: 'Entradas, salidas y ajustes con historial completo y exportable.',
    icon: <IconRoute />,
  },
  {
    name: 'Clientes',
    description: 'Gestión de clientes y seguimiento de despachos por cuenta.',
    icon: <IconClients />,
  },
  {
    name: 'Alertas',
    description: 'Avisos automáticos cuando un producto cruza el umbral mínimo.',
    icon: <IconBell />,
  },
  {
    name: 'Usuarios y roles',
    description: 'Permisos diferenciados por rol: Admin, Almacenista, Despachador, Visualizador.',
    icon: <IconUsers />,
  },
  {
    name: 'Reportes',
    description: 'Exporta movimientos e inventario a Excel o PDF en un clic.',
    icon: <IconReport />,
  },
];

const roles = [
  {
    name: 'Admin',
    note: 'Acceso completo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L3 5v5c0 4.4 3.1 8.1 7 9 3.9-.9 7-4.6 7-9V5l-7-3z" />
      </svg>
    ),
  },
  {
    name: 'Almacenista',
    note: 'Gestión de stock',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8.5L10 4l8 4.5V17H2V8.5z" />
        <path d="M7 17v-5h6v5" />
      </svg>
    ),
  },
  {
    name: 'Despachador',
    note: 'Órdenes de salida',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 10H3" />
        <path d="M12 5l5 5-5 5" />
      </svg>
    ),
  },
  {
    name: 'Visualizador',
    note: 'Solo lectura',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 10s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" />
        <circle cx="10" cy="10" r="2.5" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: '¿Qué tipo de negocios pueden usar Stockly?',
    a: 'Cualquier equipo que necesite controlar stock, productos y despachos: clínicas, distribuidoras, bodegas o pequeños negocios con inventario físico.',
  },
  {
    q: '¿Cómo funcionan los roles y permisos?',
    a: 'Cada usuario tiene un rol asignado (Admin, Almacenista, Despachador o Visualizador) que determina qué módulos puede ver y qué acciones puede ejecutar.',
  },
  {
    q: '¿Stockly avisa cuando un producto está por agotarse?',
    a: 'Sí. Defines un umbral mínimo por producto y el módulo de Alertas te notifica automáticamente cuando el stock cae por debajo de ese límite.',
  },
  {
    q: '¿Puedo exportar mis movimientos e inventario?',
    a: 'Sí, desde el módulo de Reportes puedes exportar tu historial de movimientos e inventario a Excel o PDF en cualquier momento.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'El acceso está protegido con autenticación y cada acción queda asociada a un usuario y una fecha, lo que permite auditar cualquier cambio.',
  },
];

function ShowcaseDemo() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % showcaseTabs.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [paused]);

  const tab = showcaseTabs[active];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-3xl bg-white border border-line shadow-card overflow-hidden"
    >
      <div className="flex items-center gap-1 px-3 sm:px-4 pt-3 border-b border-line bg-subtle overflow-x-auto">
        {showcaseTabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(i)}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-colors duration-200 ${
              i === active ? 'text-brand-500 bg-white' : 'text-muted hover:text-ink'
            }`}
          >
            <span className={i === active ? 'text-brand-400' : 'text-muted'}>{t.icon}</span>
            {t.label}
            {i === active && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-brand-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div key={tab.id} className="p-5 sm:p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-ink">{tab.heading}</p>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En vivo
          </span>
        </div>
        <div className="space-y-2">
          {tab.rows.map((row, i) => (
            <div
              key={row.name}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-in-up flex items-center justify-between rounded-xl border border-line/70 bg-subtle/60 px-4 py-3"
            >
              <span className="text-sm text-ink font-medium truncate pr-3">{row.name}</span>
              <span
                className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${toneClasses[row.tone]}`}
              >
                {row.meta}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pb-4">
        {showcaseTabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-label={`Ver ${t.label}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? 'w-6 bg-brand-500' : 'w-1.5 bg-line'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-semibold text-ink group-hover:text-brand-500 transition-colors duration-150">
          {q}
        </span>
        <span
          className={`shrink-0 h-7 w-7 rounded-full border border-line flex items-center justify-center text-muted transition-all duration-300 ${
            isOpen ? 'rotate-45 border-brand-300 text-brand-500' : ''
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M7 1v12M1 7h12" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-muted leading-relaxed pb-5 pr-10">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { scrolled, progress } = useScrollProgress();
  const { containerRef: heroRef, blobARef, blobBRef } = useMouseParallax();

  const statsSection = useInView(0.4);
  const featuresSection = useInView();
  const showcaseSection = useInView(0.15);
  const modulesSection = useInView();
  const rolesSection = useInView();
  const faqSection = useInView(0.1);
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

  const rolesCount = useCountUp(4, statsSection.inView);

  return (
    <div className="min-h-screen bg-surface text-ink overflow-x-hidden">

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-transparent" aria-hidden>
        <div
          className="h-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

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
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${
          scrolled ? 'bg-surface/90 border-line shadow-card-sm' : 'bg-surface/70 border-line/30'
        }`}
      >
        <div
          className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'py-3' : 'py-4'
          }`}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <span className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center text-white transition-transform duration-300 group-hover:rotate-[8deg]">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7.5L10 3l8 4.5v7L10 19l-8-4.5v-7z" />
                <path d="M10 3v16" />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight text-brand-500">Stockly</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted">
            <a href="#funcionalidades" className="hover:text-ink transition-colors duration-150">
              Funcionalidades
            </a>
            <a href="#modulos" className="hover:text-ink transition-colors duration-150">
              Módulos
            </a>
            <a href="#roles" className="hover:text-ink transition-colors duration-150">
              Roles
            </a>
            <a href="#faq" className="hover:text-ink transition-colors duration-150">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={ctaHref}
              className="hidden sm:inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
            >
              {ctaLabel}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="sm:hidden h-10 w-10 rounded-lg border border-line flex items-center justify-center text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {mobileMenuOpen ? <path d="M3 3l12 12M15 3L3 15" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden animate-slide-down border-t border-line bg-surface px-6 py-4 flex flex-col gap-4 text-sm font-medium text-muted">
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink">Funcionalidades</a>
            <a href="#modulos" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink">Módulos</a>
            <a href="#roles" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink">Roles</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-ink">Preguntas</a>
            <Link
              href={ctaHref}
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36 text-center"
      >
        {/* Glow blobs: outer layer carries mouse parallax, inner layer carries the organic float animation, so the two transforms don't fight on the same element */}
        <div ref={blobARef} className="absolute top-16 right-1/3 pointer-events-none transition-transform duration-300 ease-out">
          <div className="h-72 w-72 rounded-full bg-brand-500/10 blur-3xl animate-blob" />
        </div>
        <div ref={blobBRef} className="absolute bottom-8 left-1/3 pointer-events-none transition-transform duration-300 ease-out">
          <div className="h-56 w-56 rounded-full bg-accent-500/10 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating ambient icons */}
        <div className="hidden md:block absolute top-24 left-10 text-brand-300/40 animate-float" aria-hidden>
          <IconBox />
        </div>
        <div className="hidden md:block absolute top-40 right-12 text-accent-400/40 animate-float-delay" aria-hidden>
          <IconBell />
        </div>
        <div className="hidden md:block absolute bottom-24 left-1/4 text-brand-300/30 animate-float" style={{ animationDelay: '1.4s' }} aria-hidden>
          <IconRoute />
        </div>

        <div className="relative">
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-muted mb-8 shadow-card-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-ring" />
            Plataforma de inventario para equipos profesionales
          </div>

          <h1 className="animate-fade-in-up animation-delay-80 text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight text-ink leading-[1.1] mb-6">
            Controla{' '}
            <span
              className="text-gradient-brand animate-gradient-pan inline-block transition-all duration-[280ms]"
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

          <p className="animate-fade-in-up animation-delay-160 text-base sm:text-lg text-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Stockly centraliza la gestión de stock, productos y despachos en una sola plataforma.
            Diseñado para equipos que necesitan claridad y control.
          </p>

          <div className="animate-fade-in-up animation-delay-160 flex flex-wrap items-center justify-center gap-2 mb-10">
            {HERO_STATS.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-xs font-medium text-muted"
              >
                <span className="font-bold text-brand-500">{s.value}</span>
                {s.label}
              </span>
            ))}
          </div>

          <div className="animate-fade-in-up animation-delay-240 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="group relative w-full sm:w-auto overflow-hidden rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-shimmer opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" aria-hidden />
              <span className="relative">{ctaLabel}</span>
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
                {['w-2/3', 'w-1/2', 'w-3/4'].map((w, i) => (
                  <div key={i} className="rounded-xl bg-subtle h-14 p-2.5 flex flex-col justify-end">
                    <div className={`h-1.5 ${w} rounded-full bg-brand-200/70`} />
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-2 w-full rounded-full bg-subtle" />
                <div className="h-2 w-4/5 rounded-full bg-subtle" />
                <div className="h-2 w-3/5 rounded-full bg-subtle" />
              </div>
            </div>
          </div>

          {/* Floating alert toast */}
          <div className="hidden sm:flex animate-float absolute -right-6 -top-6 items-center gap-2 rounded-xl bg-white border border-line shadow-card px-3.5 py-2.5">
            <span className="h-7 w-7 rounded-full bg-accent-50 text-accent-500 flex items-center justify-center">
              <IconBell />
            </span>
            <div className="text-left">
              <p className="text-xs font-semibold text-ink">Stock bajo</p>
              <p className="text-[11px] text-muted">Vendaje neuromuscular</p>
            </div>
          </div>

          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 bg-brand-500/10 blur-xl rounded-full" />
        </div>
      </section>

      {/* ─── VALUE STATS STRIP ───────────────────────────────────────── */}
      <section className="bg-white border-y border-line">
        <div
          ref={statsSection.ref}
          className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
        >
          <div className={`transition-all duration-500 ${reveal(statsSection.inView)}`}>
            <p className="text-2xl sm:text-3xl font-bold text-brand-500">{rolesCount}</p>
            <p className="text-xs text-muted mt-1">Roles de acceso</p>
          </div>
          <div
            style={{ transitionDelay: '80ms' }}
            className={`transition-all duration-500 ${reveal(statsSection.inView)}`}
          >
            <p className="text-2xl sm:text-3xl font-bold text-brand-500">5</p>
            <p className="text-xs text-muted mt-1">Módulos integrados</p>
          </div>
          <div
            style={{ transitionDelay: '160ms' }}
            className={`transition-all duration-500 ${reveal(statsSection.inView)}`}
          >
            <p className="text-2xl sm:text-3xl font-bold text-brand-500">100%</p>
            <p className="text-xs text-muted mt-1">Movimientos trazables</p>
          </div>
          <div
            style={{ transitionDelay: '240ms' }}
            className={`transition-all duration-500 ${reveal(statsSection.inView)}`}
          >
            <p className="text-2xl sm:text-3xl font-bold text-brand-500">24/7</p>
            <p className="text-xs text-muted mt-1">Panel disponible</p>
          </div>
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
              className={`group bg-white rounded-2xl p-6 border border-line/60 shadow-card-sm transition-all duration-500 hover:shadow-card hover:border-brand-200 hover:-translate-y-1 cursor-default ${reveal(featuresSection.inView)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-400 transition-colors duration-200 group-hover:bg-brand-100 group-hover:text-brand-500">
                  {f.icon}
                </span>
                <span className="text-xs font-bold text-brand-300 tracking-widest">{f.label}</span>
              </div>
              <h3 className="text-sm font-semibold text-ink mt-1 mb-2">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRODUCT SHOWCASE ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div ref={showcaseSection.ref}>
          <div
            className={`text-center mb-10 transition-all duration-500 ${reveal(showcaseSection.inView, 'opacity-0 translate-y-6')}`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
              Vista previa
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              Todo tu inventario, en un solo panel
            </h2>
            <p className="text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
              Cambia de módulo y mira cómo Stockly organiza cada parte de tu operación.
            </p>
          </div>

          <div
            className={`max-w-2xl mx-auto transition-all duration-700 ${reveal(showcaseSection.inView, 'opacity-0 translate-y-10 scale-[0.98]')}`}
          >
            <ShowcaseDemo />
          </div>
        </div>
      </section>

      {/* ─── MODULES ─────────────────────────────────────────────────── */}
      <section id="modulos" className="bg-white border-y border-line py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div ref={modulesSection.ref}>
            <div
              className={`text-center mb-12 transition-all duration-500 ${reveal(modulesSection.inView, 'opacity-0 translate-y-6')}`}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Plataforma
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">Módulos disponibles</h2>
              <p className="text-sm text-muted mt-3 max-w-md mx-auto leading-relaxed">
                Cada módulo está integrado para darte visibilidad completa de tu operación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((mod, i) => (
                <div
                  key={mod.name}
                  style={{ transitionDelay: `${i * 90}ms` }}
                  className={`group relative rounded-2xl border border-line p-7 transition-all duration-500 hover:border-brand-200 hover:shadow-card hover:-translate-y-1 cursor-default ${reveal(modulesSection.inView)}`}
                >
                  <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Disponible
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-brand-50 mb-5 transition-colors duration-200 group-hover:bg-brand-100 flex items-center justify-center text-brand-400 group-hover:text-brand-500">
                    {mod.icon}
                  </div>
                  <h3 className="text-base font-semibold text-ink">{mod.name}</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{mod.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROLES ───────────────────────────────────────────────────── */}
      <section id="roles" className="max-w-6xl mx-auto px-6 py-20">
        <div ref={rolesSection.ref}>
          <div
            className={`text-center mb-10 transition-all duration-500 ${reveal(rolesSection.inView, 'opacity-0 translate-y-6')}`}
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
                className={`group rounded-2xl border border-line bg-white p-5 text-center transition-all duration-500 hover:border-brand-200 hover:shadow-card hover:-translate-y-1 cursor-default ${reveal(rolesSection.inView, 'opacity-0 translate-y-6')}`}
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

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-white border-y border-line py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div ref={faqSection.ref}>
            <div
              className={`text-center mb-10 transition-all duration-500 ${reveal(faqSection.inView, 'opacity-0 translate-y-6')}`}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Dudas frecuentes
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">Preguntas y respuestas</h2>
            </div>

            <div
              className={`rounded-2xl border border-line px-6 transition-all duration-500 ${reveal(faqSection.inView, 'opacity-0 translate-y-6')}`}
            >
              {faqs.map((item, i) => (
                <FaqItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq((cur) => (cur === i ? null : i))}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div
          ref={ctaSection.ref}
          className={`relative overflow-hidden rounded-3xl bg-brand-500 px-8 py-16 text-center transition-all duration-700 ${reveal(ctaSection.inView, 'opacity-0 translate-y-8')}`}
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-accent-500/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl pointer-events-none" />

          {/* Floating decorative icons */}
          <div className="hidden md:flex absolute top-10 left-14 h-10 w-10 rounded-xl bg-white/10 items-center justify-center text-white/70 animate-float" aria-hidden>
            <IconBox />
          </div>
          <div className="hidden md:flex absolute bottom-12 right-16 h-10 w-10 rounded-xl bg-white/10 items-center justify-center text-white/70 animate-float-delay" aria-hidden>
            <IconBell />
          </div>

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              ¿Listo para empezar?
            </h2>
            <p className="text-sm text-white/70 max-w-sm mx-auto mb-8 leading-relaxed">
              Accede a tu panel y comienza a gestionar tu inventario hoy mismo.
            </p>
            <Link
              href={ctaHref}
              className="group relative inline-flex overflow-hidden rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-500 transition-all duration-200 hover:bg-brand-50 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-shimmer opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" aria-hidden />
              <span className="relative">{ctaLabel}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-line bg-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8">
            <div>
              <span className="text-lg font-bold tracking-tight text-brand-500">Stockly</span>
              <p className="text-xs text-muted mt-2 leading-relaxed max-w-xs">
                Plataforma de gestión de inventario, productos y despachos para equipos
                profesionales.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Producto
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <a href="#funcionalidades" className="hover:text-ink transition-colors duration-150">Funcionalidades</a>
                <a href="#modulos" className="hover:text-ink transition-colors duration-150">Módulos</a>
                <a href="#roles" className="hover:text-ink transition-colors duration-150">Roles</a>
                <a href="#faq" className="hover:text-ink transition-colors duration-150">Preguntas frecuentes</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Cuenta
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <Link href={ctaHref} className="hover:text-ink transition-colors duration-150">
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Sistema de Gestión de Inventario &copy; {new Date().getFullYear()}
            </p>
            <p className="text-xs text-muted">Hecho para equipos que necesitan control real.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
