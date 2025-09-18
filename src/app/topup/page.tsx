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
  const [starsLink, setStarsLink] = useState<string>('');
  const [tonLink, setTonLink] = useState<string>('');

  useEffect(()=>{ try{ tg?.expand?.(); }catch{} },[tg]);

  const openLink = (url: string) => {
    try { if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; } } catch {}
    try { if (tg?.openLink) { tg.openLink(url); return; } } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  async function withTimeout<T>(p: Promise<T>, ms=12000): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), ms);
    try {
      // @ts-ignore
      const r = await p;
      return r;
    } finally {
      clearTimeout(t);
    }
  }

  const topupStars = async () => {
    setError('');
    setStarsLink('');
    if (!initData) { setError('Открой Mini App внутри Telegram'); return; }
    setBusyStars(true);
    try {
      const res = await withTimeout(fetch('/api/topup/stars', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ stars })
      }));
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      setStarsLink(j.link);
    } catch (e:any) {
      console.error(e);
      setError(e?.name === 'AbortError' ? 'Таймаут. Попробуй ещё раз.' : (e?.message || 'Ошибка'));
    } finally {
      setBusyStars(false);
    }
  };

  const topupTon = async () => {
    setError('');
    setTonLink('');
    if (!initData) { setError('Открой Mini App внутри Telegram'); return; }
    setBusyTon(true);
    try {
      const res = await withTimeout(fetch('/api/topup/ton', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ rub: tonRub })
      }));
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      setTonLink(j.pay_url);
    } catch (e:any) {
      console.error(e);
      setError(e?.name === 'AbortError' ? 'Таймаут. Попробуй ещё раз.' : (e?.message || 'Ошибка'));
    } finally {
      setBusyTon(false);
    }
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
            {busyStars?'Создаём счёт…':'Создать счёт'}
          </Button>
          {starsLink && (
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={()=>openLink(starsLink)}>Оплатить звёздами</Button>
              <a className="text-xs underline break-all" href={starsLink} target="_blank" rel="noreferrer">Ссылка на оплату</a>
            </div>
          )}
        </div>
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
