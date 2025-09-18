import { NextRequest, NextResponse } from 'next/server';
import { getAdminDB } from '../../../lib/firebaseAdmin';
import { getUserIdFromRequest } from '../../../lib/telegram';

/** Helper: safely parse Telegram initData JSON 'user' field */
function parseUserFromInit(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const raw = params.get('user');
    const u = raw ? JSON.parse(raw) : null;
    return u || null;
  } catch { return null; }
}

async function fetchAvatarUrl(userId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const r1 = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    const j1 = await r1.json();
    if (!j1?.ok || !j1?.result?.photos?.length) return null;
    const sizes = j1.result.photos?.[0];
    const fileId = sizes?.pop()?.file_id || sizes?.[0]?.file_id;
    if (!fileId) return null;
    const r2 = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const j2 = await r2.json();
    if (!j2?.ok || !j2?.result?.file_path) return null;
    const path = j2.result.file_path;
    return `https://api.telegram.org/file/bot${token}/${path}`;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    const id = getUserIdFromRequest(req as unknown as Request);
    const adminDb = getAdminDB();

    // read existing flags if present
    const ref = adminDb.collection('users').doc(id);
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() || {} : {};

    const u = parseUserFromInit(initData) || {};
    let photo_url = u.photo_url || existing.photo_url || null;
    if (!photo_url) {
      photo_url = await fetchAvatarUrl(id);
    }

    const userDoc = {
      tg_id: id,
      username: u.username ?? existing.username ?? null,
      first_name: u.first_name ?? existing.first_name ?? null,
      last_name: u.last_name ?? existing.last_name ?? null,
      photo_url: photo_url ?? null,
      banned: !!existing.banned,
      verified: !!existing.verified,
      updated_at_ms: Date.now(),
      created_at_ms: existing.created_at_ms || Date.now(),
    };

    await ref.set(userDoc, { merge: true });

    return NextResponse.json({ id, ...userDoc });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'internal' }, { status: 500 });
  }
}
