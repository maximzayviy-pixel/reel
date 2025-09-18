export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../../lib/telegram';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req as unknown as Request);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const adminDb = getAdminDB();
  // Avoid composite index - filter equality then sort in-memory
  const snap = await adminDb.collection('payments').where('user_id','==',userId).get();
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  items.sort((a,b) => (b.created_at_ms||0) - (a.created_at_ms||0));
  return NextResponse.json({ items: items.slice(0, 100) });
}