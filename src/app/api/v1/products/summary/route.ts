import { productController } from '@/controller/ProductController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return productController.getSummary();
}
