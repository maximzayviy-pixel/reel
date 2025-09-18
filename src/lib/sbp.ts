/** Парсер суммы из ссылки СБП (URL). Ищем распространённые имена параметров. */
export function parseSBPUrlAmount(url: string): number | undefined {
  try {
    const u = new URL(url);
    const params = u.searchParams;
    const keys = ['amount','sum','Amount','AMOUNT','a','s'];
    for (const k of keys) {
      const v = params.get(k);
      if (v) {
        const n = parseFloat(v.replace(',', '.'));
        if (!Number.isNaN(n) && n > 0) return n;
      }
    }
  } catch {}
  return undefined;
}
