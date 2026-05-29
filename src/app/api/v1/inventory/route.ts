import { NextRequest } from 'next/server';
import { inventoryController } from '@/controller/InventoryController';
import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await getDataSource();
  return inventoryController.getInventory(request);
}
