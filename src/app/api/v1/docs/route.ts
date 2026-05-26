import { NextResponse } from 'next/server';
import { getSwaggerSpec } from '@/lib/swagger';

export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json(getSwaggerSpec());
}
