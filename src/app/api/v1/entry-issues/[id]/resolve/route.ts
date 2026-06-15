import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/permissions';
import { entryIssueService } from '@/service/EntryIssueService';
import { BusinessError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { resolvedByMovementId } = body;
    if (!resolvedByMovementId) {
      return NextResponse.json({ error: 'resolvedByMovementId es requerido' }, { status: 400 });
    }
    await entryIssueService.resolve(id, resolvedByMovementId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
