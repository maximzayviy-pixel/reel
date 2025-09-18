import type { NextRequest } from 'next/server';

export function requireAdmin(req: NextRequest) {
  const adminId = process.env.ADMIN_TG_ID || process.env.TG_ADMIN_ID || process.env.ADMIN_CHAT_ID;
  if (!adminId) throw new Error('ADMIN_TG_ID env not set');

  const initData = req.headers.get('x-telegram-init-data') || '';
  // Cheap parse: try to extract user.id from init data payload
  let uid: string | null = null;
  try {
    const p = new URLSearchParams(initData);
    const u = p.get('user');
    if (u) {
      const ju = JSON.parse(u);
      uid = String(ju.id);
    }
  } catch {}

  if (uid && uid === String(adminId)) return true;

  // Also allow a server-side secret header for testing
  const secret = req.headers.get('x-admin-secret');
  if (secret && secret === (process.env.ADMIN_SECRET || '')) return true;

  throw new Error('Not authorized');
}
