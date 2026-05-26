import { NextRequest } from 'next/server';
import { categoryController } from '@/controller/CategoryController';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return categoryController.getSubcategories(id);
}
