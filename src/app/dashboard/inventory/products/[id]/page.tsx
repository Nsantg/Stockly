import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ProductDetailClient from './ProductDetailClient';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/dashboard');

  const { id } = await params;
  return <ProductDetailClient id={id} rol={session.user.rol} />;
}
