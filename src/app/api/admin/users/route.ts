import { NextResponse } from 'next/server';
import { getAdminDB } from '../../../../lib/firebaseAdmin';

export async function GET() {
  const adminDb = getAdminDB();
  const snap = await adminDb.collection('users').orderBy('created_at_ms','desc').limit(50).get();
  return NextResponse.json({ items: snap.docs.map(d => ({ id:d.id, ...d.data() })) });
}