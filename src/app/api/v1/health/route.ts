import { getDataSource } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await getDataSource();
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
