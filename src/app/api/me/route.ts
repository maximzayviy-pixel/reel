import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest, isAdminRequest } from '../../../lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req as unknown as Request);
  const isAdmin = isAdminRequest(req as unknown as Request);
  return NextResponse.json({ userId, isAdmin });
}
