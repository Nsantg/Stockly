import { NextRequest } from 'next/server';
import { alertController } from '@/controller/AlertController';
import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await getDataSource();
  return alertController.getExpirationAlerts(request);
}
