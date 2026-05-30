import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ClientsClient from './ClientsClient';

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const rol = session!.user.rol;
  return <ClientsClient rol={rol} />;
}
