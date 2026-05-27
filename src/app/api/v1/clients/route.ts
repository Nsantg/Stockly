import { NextRequest } from 'next/server';
import { clientController } from '@/controller/ClientController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return clientController.getAll();
}

export async function POST(request: NextRequest) {
  return clientController.create(request);
}
