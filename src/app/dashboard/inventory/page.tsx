import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import InventoryClient from './InventoryClient';

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  const rol = session!.user.rol;
  return <InventoryClient rol={rol} />;
}
