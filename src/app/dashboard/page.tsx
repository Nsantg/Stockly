import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignOutButton from './SignOutButton';

const rolStyles: Record<string, { bg: string; text: string; dot: string }> = {
  Admin: {
    bg: 'bg-brand-50',
    text: 'text-brand-500',
    dot: 'bg-brand-500',
  },
  Almacenista: {
    bg: 'bg-accent-50',
    text: 'text-accent-600',
    dot: 'bg-accent-500',
  },
  Despachador: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  Visualizador: {
    bg: 'bg-subtle',
    text: 'text-muted',
    dot: 'bg-muted',
  },
};

const modules = [
  { name: 'Inventario', description: 'Control de stock y existencias' },
  { name: 'Productos', description: 'Catálogo y referencias' },
  { name: 'Despachos', description: 'Órdenes y movimientos' },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { nombre, apellido, email, rol } = session.user;
  const style = rolStyles[rol] ?? rolStyles.Visualizador;

  return (
    <div className="min-h-screen bg-surface">

      {/* Header */}
      <header className="bg-white border-b border-line sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-brand-500">Stockly</span>
          <SignOutButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto py-10 px-6 space-y-6">

        {/* Welcome */}
        <div className="animate-fade-in-up">
          <h2 className="text-xl font-semibold text-ink">Bienvenido, {nombre}</h2>
          <p className="text-sm text-muted mt-0.5">Aquí tienes el resumen de tu cuenta.</p>
        </div>

        {/* Session card */}
        <div className="animate-fade-in-up animation-delay-80 bg-white rounded-2xl shadow-card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-5">
            Sesión activa
          </p>
          <div className="divide-y divide-subtle">
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Nombre</span>
              <span className="text-sm font-medium text-ink">{nombre} {apellido}</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Correo</span>
              <span className="text-sm text-ink">{email}</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Rol</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {rol}
              </span>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
            Módulos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {modules.map((mod, i) => (
              <div
                key={mod.name}
                style={{ animationDelay: `${(i + 2) * 80}ms` }}
                className="animate-fade-in-up bg-white rounded-2xl p-5 shadow-card-sm opacity-50 cursor-not-allowed select-none"
              >
                <div className="h-7 w-7 rounded-lg bg-surface mb-4" />
                <p className="text-sm font-medium text-ink">{mod.name}</p>
                <p className="text-xs text-muted mt-0.5">{mod.description}</p>
                <span className="mt-3 inline-block text-xs font-medium text-muted/70 border border-line rounded-full px-2.5 py-0.5">
                  Próximamente
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
