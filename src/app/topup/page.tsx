'use client';
import React, { useMemo, useState } from 'react';

export default function TopupPage() {
  const [tab, setTab] = useState<'stars' | 'ton'>('stars');
  const [amount, setAmount] = useState<number>(50);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const tg = (globalThis as any)?.Telegram?.WebApp;

  async function createStarsInvoice() {
    setError(''); setLoading(true);
    try {
      const init = tg?.initData || '';
      const res = await fetch('/api/topup/stars', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': init,
        },
        body: JSON.stringify({ amount })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'server_error');
      const link: string = json.result;
      if (tg?.openInvoice) {
        tg.openInvoice(link, (status: any) => {
          // status: paid / cancelled / failed
          if (status === 'paid') tg?.showAlert?.('Оплачено!');
        });
      } else {
        window.location.href = link;
      }
    } catch (e: any) {
      setError(e.message || 'error');
    } finally {
      setLoading(false);
    }
  }

  async function createTonInvoice() {
    setError(''); setLoading(true);
    try {
      const init = tg?.initData || '';
      const res = await fetch('/api/topup/ton', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': init,
        },
        body: JSON.stringify({ rub: Math.max(1, Math.floor(amount/2)) })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'server_error');
      const url: string = json.result;
      window.location.href = url;
    } catch (e: any) {
      setError(e.message || 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <a href="/" className="text-blue-500 hover:underline">Назад</a>
    </div>
    <div className="max-w-xl mx-auto p-5 pb-24">
      <h1 className="text-3xl font-semibold mb-5">Пополнение</h1>

      <div className="mb-4 inline-flex bg-gray-100 rounded-xl p-1">
        <button onClick={()=>setTab('stars')}
          className={'px-4 py-2 rounded-lg transition ' + (tab==='stars'?'bg-white shadow':'opacity-70')}>
          Звёзды
        </button>
        <button onClick={()=>setTab('ton')}
          className={'px-4 py-2 rounded-lg transition ' + (tab==='ton'?'bg-white shadow':'opacity-70')}>
          TON
        </button>
      </div>

      {tab==='stars' && (
        <div className="space-y-4">
          <label className="block text-gray-500">Сумма в звёздах</label>
          <input type="number" min={1} value={amount}
            onChange={e=>setAmount(parseInt(e.target.value||'0'))}
            className="w-full rounded-xl border bg-gray-100/70 px-4 py-3 outline-none" />
          <button onClick={createStarsInvoice} disabled={loading}
            className="w-full rounded-2xl py-3 text-white font-semibold
                       bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg">
            {loading ? 'Создаём...' : 'Создать счёт'}
          </button>
        </div>
      )}

      {tab==='ton' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Будет открыт криптопроцессинг; мы зачислим TON после подтверждения.</p>
          <button onClick={createTonInvoice} disabled={loading}
            className="w-full rounded-2xl py-3 text-white font-semibold
                       bg-gradient-to-r from-teal-500 to-emerald-600 shadow-lg">
            {loading ? 'Создаём...' : 'Создать счёт в TON'}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-red-500">Ошибка: {error}</p>}
      <p className="text-xs text-gray-500 mt-6">
        Для звёзд оплата происходит внутри Telegram. Для TON откроется платёжная страница.
      </p>
    </div>
  );
}
