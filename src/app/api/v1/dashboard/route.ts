import { NextRequest } from 'next/server';
import { dashboardController } from '@/controller/DashboardController';
import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await getDataSource();
  return dashboardController.getKpis(request);
}
