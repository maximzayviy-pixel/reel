export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../../../lib/firebaseAdmin';
import { isAdminRequest } from '../../../../../lib/telegram';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req as unknown as Request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const adminDb = getAdminDB();
  const q = await adminDb.collection('payments').where('status','==','pending').orderBy('created_at','desc').limit(100).get();
  const items = q.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return NextResponse.json({ items });
}
