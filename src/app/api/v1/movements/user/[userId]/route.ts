import { NextRequest } from 'next/server';
import { movementController } from '@/controller/MovementController';
import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  await getDataSource();
  const { userId } = await params;
  return movementController.getMovementsByUser(request, userId);
}
