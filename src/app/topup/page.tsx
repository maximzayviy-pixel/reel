'use client';

import React, { useState } from 'react';
import { getInitData, getUserIdUnsafe } from '@/lib/tg';

function GradientButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        'w-full rounded-2xl py-4 px-5 text-white font-semibold shadow ' +
        'bg-gradient-to-r from-sky-500 to-blue-600 active:opacity-90 disabled:opacity-50'
      }
    />
  );
}

export default function TopupPage() {
  const [tab, setTab] = useState<'stars' | 'ton'>('stars');
  const [stars, setStars] = useState('50');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const uid = getUserIdUnsafe();

  const back = () => {
    const tg = (window as any)?.Telegram?.WebApp;
    tg?.BackButton?.show();
    tg?.BackButton?.onClick(() => history.back());
    history.back();
  };

  async function createStarsInvoice() {
    setErr(null); setLoading(true);
    try {
      const initData = getInitData();
      const res = await fetch('/api/topup/stars', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ amount: Number(stars) || 0 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'createStars failed');

      const tg = (window as any)?.Telegram?.WebApp;
      tg?.openInvoice?.(data.result);
      if (!tg?.openInvoice) window.open(data.result, '_blank');
    } catch (e: any) {
      setErr(e.message || 'unknown');
    } finally {
      setLoading(false);
    }
  }

  async function createTonInvoice() {
    setErr(null); setLoading(true);
    try {
      const initData = getInitData();
      const res = await fetch('/api/topup/ton', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ amount_rub: Math.max(100, (Number(stars) || 0)) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'createTon failed');

      window.open(data.result, '_blank');
    } catch (e: any) {
      setErr(e.message || 'unknown');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 pb-24 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={back} className="text-sky-600 font-medium">Назад</button>
        <h1 className="text-3xl font-extrabold">Пополнение</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab('stars')}
          className={`px-4 py-2 rounded-xl border ${tab==='stars'?'bg-white shadow':'bg-gray-100'}`}
        >Звёзды</button>
        <button
          onClick={() => setTab('ton')}
          className={`px-4 py-2 rounded-xl border ${tab==='ton'?'bg-white shadow':'bg-gray-100'}`}
        >TON</button>
      </div>

      {tab==='stars' ? (
        <div className="space-y-4">
          <label className="block text-gray-600 text-sm">Сумма в звёздах</label>
          <input
            inputMode="numeric"
            value={stars}
            onChange={e=>setStars(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 bg-gray-100"
          />
          <GradientButton disabled={loading} onClick={createStarsInvoice}>
            {loading ? 'Создаём…' : 'Создать счёт'}
          </GradientButton>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Будет открыт криптопроцессинг; мы зачислим TON после подтверждения.
          </p>
          <GradientButton disabled={loading} onClick={createTonInvoice}>
            {loading ? 'Создаём…' : 'Создать счёт в TON'}
          </GradientButton>
        </div>
      )}

      {err && <p className="mt-4 text-red-600">Ошибка: {err}</p>}

      <p className="mt-6 text-gray-500 text-sm">
        Для звёзд оплата происходит внутри Telegram. Для TON откроется платёжная страница.
      </p>
    </div>
  );
}
