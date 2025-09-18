'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';
import { useTG } from '../../context/UserContext';
import { fetchBalance } from '../../lib/fetchBalance';

export default function TopupPage(){
  const { initData, loading, refreshBalances } = useTG();
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [stars, setStars] = useState<number>(50);
  const [tonRub, setTonRub] = useState<number>(1000);
  const [error, setError] = useState('');
  const [busyStars, setBusyStars] = useState(false);
  const [busyTon, setBusyTon] = useState(false);
  const [starsLink, setStarsLink] = useState<string>('');
  const [tonLink, setTonLink] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [lastStarsBefore, setLastStarsBefore] = useState<number | null>(null);
  const pollRef = useRef<any>(null);

  useEffect(()=>{ try{ tg?.expand?.(); }catch{} },[tg]);

  const openLink = (url: string) => {
    try { if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; } } catch {}
    try { if (tg?.openLink) { tg.openLink(url); return; } } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  async function withTimeout<T>(p: Promise<T>, ms=12000): Promise<T> {
    const t = setTimeout(()=>{ throw new Error('timeout'); }, ms);
    try { const r = await p; return r; } finally { clearTimeout(t); }
  }

  const topupStars = async () => {
    setError('');
    setStarsLink('');
    if (!initData) { setError('Открой Mini App внутри Telegram'); return; }
    setBusyStars(true);
    try {
      const before = await fetchBalance(initData);
      setLastStarsBefore(before.stars);
      const res = await withTimeout(fetch('/api/topup/stars', {
        method:'POST',
        headers: {'Content-Type':'application/json','x-telegram-init-data': initData},
        body: JSON.stringify({ stars })
      }));
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      setStarsLink(j.link);
      setStatus('Счёт готов. Нажми «Оплатить звёздами» и не закрывай Telegram.');
    } catch (e:any) {
      setError(e?.message || 'Ошибка');
    } finally {
      setBusyStars(false);
    }
  };

  const onClickPayStars = async () => {
    if (!starsLink) return;
    setStatus('Ожидаем подтверждение оплаты…');
    openLink(starsLink);
    if (pollRef.current) clearInterval(pollRef.current);
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries += 1;
      try {
        const b = await fetchBalance(initData || undefined);
        if (lastStarsBefore !== null && b.stars > lastStarsBefore) {
          setStatus('Оплата зафиксирована ✅ Баланс обновлён.');
          clearInterval(pollRef.current);
          pollRef.current = null;
          refreshBalances();
        } else if (tries >= 10) {
          setStatus('Долго нет ответа. Если платёж прошёл — обнови баланс вручную.');
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {}
    }, 3000);
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
      setStatus('Счёт готов. Нажми «Оплатить TON».');
    } catch (e:any) {
      setError(e?.message || 'Ошибка');
    } finally {
      setBusyTon(false);
    }
  };

  const refreshNow = async () => {
    setStatus('Обновляем баланс…');
    try {
      await refreshBalances();
      setStatus('Баланс обновлён.');
    } catch { setStatus('Не удалось обновить.'); }
  };

  // subscribe to invoiceClosed just in case
  useEffect(() => {
    const handler = (d:any) => {
      if (!d) return;
      if (d.status === 'paid') {
        setStatus('Оплата подтверждена. Обновляем баланс…');
        refreshNow();
      } else if (d.status) {
        setStatus(`Статус: ${d.status}`);
      }
    };
    try{ tg?.onEvent?.('invoiceClosed', handler); }catch{}
    return () => { try{ tg?.offEvent?.('invoiceClosed', handler); }catch{} };
  }, [tg]);

  return (
    <>
      <h1 className="text-lg font-semibold mb-2">Пополнение</h1>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {status && <div className="text-sm text-blue-700 mb-2">{status} <button className="underline" onClick={refreshNow}>Обновить баланс</button></div>}

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
              <Button onClick={onClickPayStars}>Оплатить звёздами</Button>
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
