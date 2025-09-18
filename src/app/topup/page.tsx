'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';
import { useTG } from '../../context/UserContext';

export default function TopupPage(){
  const { initData, loading } = useTG();
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [stars, setStars] = useState<number>(50);
  const [tonRub, setTonRub] = useState<number>(1000);
  const [error, setError] = useState('');
  const [busyStars, setBusyStars] = useState(false);
  const [busyTon, setBusyTon] = useState(false);
  const [lastLink, setLastLink] = useState<string>('');

  useEffect(()=>{ try{ tg?.expand?.(); }catch{} },[tg]);

  const safeOpen = (url: string) => {
    setLastLink(url);
    try {
      if (tg?.openInvoice) return tg.openInvoice(url, ()=>{});
      if (tg?.openLink) return tg.openLink(url);
      if (tg?.openTelegramLink) return tg.openTelegramLink(url);
    } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const topupStars = async () => {
    setError('');
    if (!initData) { setError('Открой Mini App внутри Telegram'); return; }
    setBusyStars(true);
    try {
      const res = await fetch('/api/topup/stars', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ stars })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      safeOpen(j.link);
    } catch (e:any) { console.error(e); setError(e.message); }
    finally { setBusyStars(false); }
  };

  const topupTon = async () => {
    setError('');
    if (!initData) { setError('Открой Mini App внутри Telegram'); return; }
    setBusyTon(true);
    try {
      const res = await fetch('/api/topup/ton', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ rub: tonRub })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      safeOpen(j.pay_url);
    } catch (e:any) { console.error(e); setError(e.message); }
    finally { setBusyTon(false); }
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
        <div className="mt-3">
          <Button onClick={topupStars} disabled={busyStars || loading}>
            {busyStars?'Создаём счёт…':'Пополнить звёздами'}
          </Button>
        </div>
        {lastLink && <div className="text-xs opacity-60 mt-2 break-all">Ссылка на оплату: {lastLink}</div>}
        <div className="text-xs opacity-60 mt-2">2 ⭐ = 1 ₽. После оплаты звёзды зачислим автоматически.</div>
      </div>

      <div className="card mt-4">
        <div className="font-semibold mb-2">TON через CryptoCloud</div>
        <div className="flex gap-2 items-center">
          <input type="number" min={1} value={tonRub} onChange={e=>setTonRub(parseInt(e.target.value||'0'))} className="border rounded-xl p-2 w-28" />
          <div className="text-sm opacity-70">₽</div>
        </div>
        <div className="mt-3">
          <Button onClick={topupTon} disabled={busyTon || loading}>
            {busyTon?'Создаём счёт…':'Создать счёт на оплату TON'}
          </Button>
        </div>
      </div>

      <Tabs/>
    </>
  );
}
