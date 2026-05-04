import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignOutButton from './SignOutButton';

const rolColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-800',
  Almacenista: 'bg-green-100 text-green-800',
  Despachador: 'bg-blue-100 text-blue-800',
  Visualizador: 'bg-gray-100 text-gray-800',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { nombre, apellido, email, rol } = session.user;
  const rolColor = rolColors[rol] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">Stockly</h1>
        <SignOutButton />
      </header>

      <main className="max-w-4xl mx-auto py-10 px-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de sesión</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500 w-24">Nombre</dt>
              <dd className="text-gray-900">{nombre} {apellido}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500 w-24">Email</dt>
              <dd className="text-gray-900">{email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-500 w-24">Rol</dt>
              <dd>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rolColor}`}>
                  {rol}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <p className="text-sm text-yellow-800 font-medium">🚧 Módulos en desarrollo</p>
          <p className="text-sm text-yellow-700 mt-1">
            Los módulos de inventario, productos y despachos estarán disponibles próximamente.
          </p>
        </div>
      </main>
    </div>
  );
}
