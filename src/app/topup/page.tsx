'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';

export default function TopupPage(){
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const initData = tg?.initData || '';
  const [stars, setStars] = useState<number>(50);
  const [tonRub, setTonRub] = useState<number>(1000);
  const [error, setError] = useState('');

  useEffect(()=>{ try{ tg?.expand?.(); }catch{} },[tg]);

  const topupStars = async () => {
    setError('');
    try {
      const res = await fetch('/api/topup/stars', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ stars })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      const link = j.invoice_link;
      if ((window as any)?.Telegram?.WebApp?.openInvoice) {
        (window as any).Telegram.WebApp.openInvoice(link, (status: string) => {
          // 'paid'/'cancelled'/'failed' (WebApp event name may vary)
          if (status === 'paid') alert('Зачисление звёзд будет выполнено автоматически');
        });
      } else {
        window.open(link, '_blank');
      }
    } catch (e:any) { setError(e.message); }
  };

  const topupTon = async () => {
    setError('');
    try {
      const res = await fetch('/api/topup/ton', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ rub: tonRub })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      window.open(j.pay_url, '_blank');
      alert('После оплаты TON провайдер пришлёт подтверждение, и TON будут зачислены на баланс.');
    } catch (e:any) { setError(e.message); }
  };

  return (
    <>
      <h1 className="text-lg font-semibold mb-2">Пополнение</h1>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <div className="card">
        <div className="font-semibold mb-2">Звёзды Telegram</div>
        <div className="flex gap-2 items-center">
          <input type="number" min={1} value={stars} onChange={e=>setStars(parseInt(e.target.value||'0'))} className="border rounded-xl p-2 w-28" />
          <div className="text-sm opacity-70">⭐</div>
        </div>
        <div className="mt-3"><Button onClick={topupStars}>Пополнить звёздами</Button></div>
        <div className="text-xs opacity-60 mt-2">Оплата внутри Telegram. После успеха звёзды будут зачислены.</div>
      </div>

      <div className="card mt-4">
        <div className="font-semibold mb-2">TON через CryptoCloud</div>
        <div className="flex gap-2 items-center">
          <input type="number" min={1} value={tonRub} onChange={e=>setTonRub(parseInt(e.target.value||'0'))} className="border rounded-xl p-2 w-28" />
          <div className="text-sm opacity-70">₽</div>
        </div>
        <div className="mt-3"><Button onClick={topupTon}>Создать счёт на оплату TON</Button></div>
        <div className="text-xs opacity-60 mt-2">Откроется платёжная страница CryptoCloud. ТОН зачислим после подтверждения.</div>
      </div>

      <Tabs/>
    </>
  );
}
