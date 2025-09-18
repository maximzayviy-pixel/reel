'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';
import { useTG } from '../../context/UserContext';

function extractInvoiceSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const startattach = u.searchParams.get('startattach');
    if (startattach && startattach.startsWith('invoice-')) return startattach.replace('invoice-','').trim();
    const m = url.match(/\/invoice\/([A-Za-z0-9_-]+)/);
    if (m) return m[1];
  } catch {}
  return null;
}

export default function TopupPage(){
  const { initData, loading, refreshBalances, balances } = useTG();
  const tg = (globalThis as any)?.Telegram?.WebApp;
  const [stars, setStars] = useState<number>(50);
  const [tonRub, setTonRub] = useState<number>(1000);
  const [error, setError] = useState('');
  const [busyStars, setBusyStars] = useState(false);
  const [busyTon, setBusyTon] = useState(false);
  const [lastLink, setLastLink] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  // expand and subscribe invoiceClosed
  useEffect(()=>{
    try{ tg?.expand?.(); }catch{}
    const handler = (d:any) => {
      console.log('[Reel] invoiceClosed event:', d);
      if (d?.status === 'paid') {
        setStatus('Оплата подтверждена. Обновляем баланс…');
        refreshBalances();
      } else if (d?.status) {
        setStatus(`Статус: ${d.status}`);
      }
    };
    try{ tg?.onEvent?.('invoiceClosed', handler); }catch{}
    return () => { try{ tg?.offEvent?.('invoiceClosed', handler); }catch{} };
  }, [tg, refreshBalances]);

  const openStarsInvoice = (url: string) => {
    setLastLink(url);
    const slug = extractInvoiceSlug(url);
    const cb = (status?: any) => {
      console.log('[Reel] openInvoice cb:', status);
      if (status === 'paid') {
        setStatus('Оплата подтверждена. Обновляем баланс…');
        refreshBalances();
      } else if (status) {
        setStatus(`Статус: ${status}`);
      }
    };
    try { if (slug && tg?.openInvoice) { tg.openInvoice(slug, cb); return; } } catch {}
    try { if (tg?.openInvoice) { tg.openInvoice(url, cb); return; } } catch {}
    try { if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; }
          if (tg?.openLink) { tg.openLink(url); return; } } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openGenericLink = (url: string) => {
    setLastLink(url);
    try { if (tg?.openLink) { tg.openLink(url); return; }
          if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; } } catch {}
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
      openStarsInvoice(j.link);
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
      openGenericLink(j.pay_url);
    } catch (e:any) { console.error(e); setError(e.message); }
    finally { setBusyTon(false); }
  };

  return (
    <>
      <h1 className="text-lg font-semibold mb-2">Пополнение</h1>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {status && <div className="text-sm text-green-700 mb-2">{status}</div>}

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
        <div className="text-xs opacity-60 mt-1">Текущий баланс: ⭐ {balances.stars}</div>
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
