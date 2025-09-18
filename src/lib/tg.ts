// src/lib/tg.ts
export function getWebApp(): any | null {
  try {
    return (globalThis as any)?.Telegram?.WebApp ?? null;
  } catch { return null; }
}

export function safeOpenInvoice(link: string) {
  const wa = getWebApp();
  // Если Telegram умеет openInvoice — попробуем; иначе просто перейдём по ссылке
  try {
    // @ts-ignore
    if (wa?.openInvoice) return wa.openInvoice(link);
  } catch {}
  window.location.href = link;
}
