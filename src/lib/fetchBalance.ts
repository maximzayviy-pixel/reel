export async function fetchBalance(initData?: string){
  const res = await fetch('/api/me/balance', {
    method: 'GET',
    headers: initData ? {'x-telegram-init-data': initData} : {},
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('balance fetch failed');
  const j = await res.json();
  return j?.balances || { stars: 0, ton: 0 };
}
