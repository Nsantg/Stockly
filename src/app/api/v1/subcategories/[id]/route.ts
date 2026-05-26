import { NextRequest } from 'next/server';
import { subcategoryController } from '@/controller/SubcategoryController';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return subcategoryController.getById(id);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return subcategoryController.update(id, request);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return subcategoryController.remove(id);
}
