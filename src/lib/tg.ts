
// small helper to read Telegram Mini App context on client
export function getInitData(): string {
  if (typeof window === 'undefined') return '';
  const tg = (window as any)?.Telegram?.WebApp;
  return tg?.initData || '';
}

export function getUserIdUnsafe(): string | undefined {
  if (typeof window === 'undefined') return;
  const tg = (window as any)?.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.id?.toString();
}
