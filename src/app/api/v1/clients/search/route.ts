import { NextRequest } from 'next/server';
import { clientController } from '@/controller/ClientController';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return clientController.search(request);
}
