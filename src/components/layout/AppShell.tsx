import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import Breadcrumbs from './Breadcrumbs';

interface AppShellProps {
  children: React.ReactNode;
}

export default async function AppShell({ children }: AppShellProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { nombre, apellido, rol } = session.user;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar nombre={nombre} apellido={apellido} rol={rol} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileDrawer nombre={nombre} apellido={apellido} rol={rol} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
