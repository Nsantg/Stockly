import { NextRequest } from 'next/server';
import { productController } from '@/controller/ProductController';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return productController.getAll(request);
}

export async function POST(request: NextRequest) {
  return productController.create(request);
}
