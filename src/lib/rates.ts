let cache = { rate: Number(process.env.TON_RUB_FALLBACK || 500), ts: 0 };
export async function getTonRate() {
  const now = Date.now();
  if (now - cache.ts > 60_000) {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub');
      const j = await res.json();
      cache.rate = j['the-open-network'].rub;
      cache.ts = now;
    } catch (e) { /* fallback */ }
  }
  return cache.rate;
}
