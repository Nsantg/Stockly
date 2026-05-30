import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  const rol = session!.user.rol;
  return <CategoriesClient rol={rol} />;
}
