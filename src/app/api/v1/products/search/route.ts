import { NextRequest } from 'next/server';
import { productController } from '@/controller/ProductController';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return productController.search(request);
}
