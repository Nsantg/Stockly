import { NextRequest } from 'next/server';
import { movementController } from '@/controller/MovementController';
import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await getDataSource();
  const { id } = await params;
  return movementController.getMovementById(request, id);
}
