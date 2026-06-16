import { NextRequest } from 'next/server';
import { settingsController } from '@/controller/SettingsController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return settingsController.get();
}

export async function PUT(request: NextRequest) {
  return settingsController.update(request);
}
