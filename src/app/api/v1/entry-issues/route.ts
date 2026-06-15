import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/permissions';
import { entryIssueService } from '@/service/EntryIssueService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const issues = await entryIssueService.getUnresolved();
    return NextResponse.json(issues);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
