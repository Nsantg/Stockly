import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MovementsClient from './MovementsClient';

export default async function MovementsPage() {
  const session = await getServerSession(authOptions);
  const rol = session!.user.rol;
  return <MovementsClient rol={rol} />;
}
