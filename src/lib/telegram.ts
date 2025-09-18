import crypto from 'crypto';

function verifyInitData(initData: string, botToken: string): boolean {
  const url = new URLSearchParams(initData);
  const dataCheckString = Array.from(url.entries())
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return hash === (url.get('hash') || '');
}

export function getUserIdFromRequest(req: Request): string {
  const init = (req.headers.get('x-telegram-init-data') || '').trim();
  if (!init) {
    if (process.env.NODE_ENV !== 'production') return 'demo';
    throw new Error('Unauthorized');
  }
  if (process.env.NODE_ENV === 'production') {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token || !verifyInitData(init, token)) throw new Error('Unauthorized');
  }
  try {
    const params = new URLSearchParams(init);
    const user = params.get('user');
    const parsed = user ? JSON.parse(user) : null;
    const id = String(parsed?.id || '');
    if (!id) throw new Error('Unauthorized');
    return id;
  } catch {
    if (process.env.NODE_ENV !== 'production') return 'demo';
    throw new Error('Unauthorized');
  }
}

export function isAdminRequest(req: Request): boolean {
  const init = (req.headers.get('x-telegram-init-data') || '').trim();
  try {
    const ids = (process.env.TELEGRAM_ADMIN_USER_IDS || '').split(',').map(s => s.trim());
    const params = new URLSearchParams(init);
    const user = params.get('user');
    const parsed = user ? JSON.parse(user) : null;
    const id = String(parsed?.id || '');
    return !!id && ids.includes(id);
  } catch { return false; }
}
