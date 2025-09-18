import { NextRequest } from 'next/server';

/** Extract TG user id from 'x-telegram-init-data' header (no strict HMAC here) */
export function getUserIdFromRequest(req: Request | NextRequest): string | null {
  try {
    const init = (req.headers as any).get ? (req as any).headers.get('x-telegram-init-data') : (req as any).headers['x-telegram-init-data'];
    if (!init) return null;
    const p = new URLSearchParams(init);
    const raw = p.get('user');
    const u = raw ? JSON.parse(raw) : null;
    return u?.id ? String(u.id) : null;
  } catch {
    return null;
  }
}

/** Is the requester one of admins defined in ENV TELEGRAM_ADMIN_USER_IDS */
export function isAdminRequest(req: Request | NextRequest): boolean {
  const uid = getUserIdFromRequest(req);
  if (!uid) return false;
  const list = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(uid);
}
