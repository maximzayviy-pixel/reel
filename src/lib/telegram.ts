// Telegram helpers: extract user id and admin guard
import { NextRequest } from 'next/server';

function parseInitData(str: string): Record<string, any> {
  const params = new URLSearchParams(str);
  const userStr = params.get('user');
  let user: any = null;
  try { if (userStr) user = JSON.parse(userStr); } catch {}
  return { user, params };
}

export function getUserIdFromRequest(req: Request | NextRequest): number | null {
  try {
    const header = (req as any).headers?.get?.('x-telegram-init-data') || (req as any).headers?.['x-telegram-init-data'];
    if (header) {
      const { user } = parseInitData(String(header));
      if (user?.id) return Number(user.id);
    }
  } catch {}

  try {
    const anyReq: any = req as any;
    const cookieVal = anyReq?.cookies?.get?.('tma_initData')?.value || anyReq?.cookies?.get?.('initData')?.value;
    if (cookieVal) {
      const { user } = parseInitData(String(cookieVal));
      if (user?.id) return Number(user.id);
    }
  } catch {}

  try {
    const url = new URL((req as any).url);
    const initData = url.searchParams.get('initData');
    if (initData) {
      const { user } = parseInitData(initData);
      if (user?.id) return Number(user.id);
    }
  } catch {}

  return null;
}

// Admin guard expected by API routes: `import { isAdminRequest } from '@/lib/telegram'`
export function isAdminRequest(req: Request | NextRequest): boolean {
  const admins = String(process.env.TELEGRAM_ADMIN_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (admins.length === 0) return false;
  const uid = getUserIdFromRequest(req);
  if (!uid) return false;
  return admins.includes(String(uid));
}
