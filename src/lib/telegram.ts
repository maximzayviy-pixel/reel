// Minimal helpers for Telegram WebApp initData parsing
import { NextRequest } from 'next/server';

function parseInitData(str: string): Record<string, any> {
  const params = new URLSearchParams(str);
  const userStr = params.get('user');
  let user: any = null;
  try { if (userStr) user = JSON.parse(userStr); } catch {}
  return { user, params };
}

/**
 * Reads Telegram user id from request:
 * - header 'x-telegram-init-data' (set by your proxy / client fetch)
 * - cookie 'tma_initData' (Telegram Mini App SDK puts it on client, you can forward it)
 * - query string 'initData' (debug fallback)
 */
export function getUserIdFromRequest(req: Request | NextRequest): number | null {
  try {
    // headers
    const header = (req.headers as any).get?.('x-telegram-init-data') || (req as any).headers?.['x-telegram-init-data'];
    if (header) {
      const { user } = parseInitData(header as string);
      if (user?.id) return Number(user.id);
    }
  } catch {}

  // cookies (NextRequest has cookies())
  try {
    const anyReq: any = req as any;
    const cookieVal = anyReq?.cookies?.get?.('tma_initData')?.value || anyReq?.cookies?.get?.('initData')?.value;
    if (cookieVal) {
      const { user } = parseInitData(cookieVal as string);
      if (user?.id) return Number(user.id);
    }
  } catch {}

  // query
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
