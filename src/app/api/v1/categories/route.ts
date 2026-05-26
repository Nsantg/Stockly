import { NextRequest } from 'next/server';
import { categoryController } from '@/controller/CategoryController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return categoryController.getAll();
}

export async function POST(request: NextRequest) {
  return categoryController.create(request);
}
