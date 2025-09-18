'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';
import { useTG } from '../../context/UserContext';

export default function TopupPage(){
  const { initData, isMiniApp } = useTG();
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [stars, setStars] = useState<number>(50);
  const [tonRub, setTonRub] = useState<number>(1000);
  const [error, setError] = useState('');
  const [busyStars, setBusyStars] = useState(false);
  const [busyTon, setBusyTon] = useState(false);
  const [starsLink, setStarsLink] = useState<string>('');
  const [tonLink, setTonLink] = useState<string>('');

  useEffect(()=>{ try{ tg?.expand?.(); }catch{} },[tg]);

  const openLink = (url: string) => {
    try { if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; } } catch {}
    try { if (tg?.openLink) { tg.openLink(url); return; } } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const topupStars = async () => {
    setError('');
    setStarsLink('');
    try {
      const res = await fetch('/api/topup/stars', {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          ...(initData ? {'x-telegram-init-data': initData} : {})
        },
        body: JSON.stringify({ stars })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      setStarsLink(j.link);
    } catch (e:any) {
      setError(e?.message || 'Ошибка');
    }
  };

  const topupTon = async () => {
    setError('');
    setTonLink('');
    try {
      const res = await fetch('/api/topup/ton', {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          ...(initData ? {'x-telegram-init-data': initData} : {})
        },
        body: JSON.stringify({ rub: tonRub })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      setTonLink(j.pay_url);
    } catch (e:any) {
      setError(e?.message || 'Ошибка');
    }
  };

  return (
    <>
      <h1 className="text-lg font-semibold mb-2">Пополнение</h1>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      {!isMiniApp && (
        <div className="text-xs text-amber-700 bg-amber-100 rounded-xl px-3 py-2 mb-2">
          Похоже, открыто в браузере. Оплатить звёздами можно только внутри Telegram.
        </div>
      )}

      <div className="card">
        <div className="font-semibold mb-2">Звёзды Telegram</div>
        <div className="flex gap-2 items-center">
          <input type="number" min={1} value={stars} onChange={e=>setStars(parseInt(e.target.value||'0'))} className="border rounded-xl p-2 w-28" />
          <div className="text-sm opacity-70">⭐</div>
        </div>
        <div className="mt-3">
          <Button onClick={topupStars} disabled={busyStars}>
            {busyStars?'Создаём счёт…':'Создать счёт'}
          </Button>
          {starsLink && (
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={()=>openLink(starsLink)}>Оплатить звёздами</Button>
              <a className="text-xs underline break-all" href={starsLink} target="_blank" rel="noreferrer">Ссылка на оплату</a>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="font-semibold mb-2">TON через CryptoCloud</div>
        <div className="flex gap-2 items-center">
          <input type="number" min={1} value={tonRub} onChange={e=>setTonRub(parseInt(e.target.value||'0'))} className="border rounded-xl p-2 w-28" />
          <div className="text-sm opacity-70">₽</div>
        </div>
        <div className="mt-3">
          <Button onClick={topupTon} disabled={busyTon}>
            {busyTon?'Создаём счёт…':'Создать счёт'}
          </Button>
          {tonLink && (
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={()=>openLink(tonLink)}>Оплатить TON</Button>
              <a className="text-xs underline break-all" href={tonLink} target="_blank" rel="noreferrer">Ссылка на оплату</a>
            </div>
          )}
        </div>
      </div>

      <Tabs/>
    </>
  );
}
