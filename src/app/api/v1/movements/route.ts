import { NextRequest } from 'next/server';
import { movementController } from '@/controller/MovementController';
import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await getDataSource();
  return movementController.getMovements(request);
}

export async function POST(request: NextRequest) {
  await getDataSource();
  return movementController.createMovement(request);
}
