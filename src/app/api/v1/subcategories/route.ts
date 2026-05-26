import { NextRequest } from 'next/server';
import { subcategoryController } from '@/controller/SubcategoryController';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const categoryId = new URL(request.url).searchParams.get('categoryId') ?? undefined;
  return subcategoryController.getAll(categoryId);
}

export async function POST(request: NextRequest) {
  return subcategoryController.create(request);
}
