import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardClient from './DashboardClient';
import type { UserRole } from './DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const { nombre, apellido, rol } = session!.user;

  return <DashboardClient user={{ nombre, apellido, rol: rol as UserRole }} />;
}
