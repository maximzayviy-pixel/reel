'use client';
import React, { useEffect, useMemo, useState } from 'react';

type DebugInfo = {
  hasRaw: boolean;
  rawLength: number;
  user?: { id: number; username?: string };
  status: string; // 'OK' or 'BAD:...' or 'NO_RAW_OR_TOKEN'
  botTokenPresent: boolean;
} | null;

export default function TopupPage() {
  const [tab, setTab] = useState<'stars' | 'ton'>('stars');
  const [amount, setAmount] = useState<number>(50);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dbg, setDbg] = useState<DebugInfo>(null);

  const tg: any = (globalThis as any)?.Telegram?.WebApp;
  const initData: string = tg?.initData || '';

  useEffect(() => {
    // Автодиагностика: спросим бэкенд видит ли initData и токен
    (async () => {
      try {
        const res = await fetch('/api/debug/tg', {
          method: 'POST',
          headers: { 'x-telegram-init-data': initData || '' }
        });
        const json = await res.json();
        setDbg(json);
      } catch {
        setDbg(null);
      }
    })();
  }, [initData]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!amount || amount < 1) return false;
    // Разрешаем сабмит только если подпись валидна или хотя бы есть сырой initData
    if (!initData) return false;
    if (dbg?.status && dbg.status !== 'OK') return false;
    return true;
  }, [loading, amount, initData, dbg?.status]);

  async function createStarsInvoice() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/topup/stars', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'create_stars_failed');
      }
      const link = json.link || json.url;
      if (link) {
        if (tg?.openInvoice) tg.openInvoice(link);
        else window.location.href = link;
      }
    } catch (e: any) {
      setError(e?.message || 'unknown_error');
    } finally {
      setLoading(false);
    }
  }

  async function createTonInvoice() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/topup/ton', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'create_ton_failed');
      const url = json.url || json.link;
      if (url) window.location.href = url;
    } catch (e: any) {
      setError(e?.message || 'unknown_error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-5 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <a href="/" className="text-blue-500 hover:underline">Назад</a>
        {/* Мини-диагностика */}
        <span className="text-xs rounded-lg px-2 py-1 bg-gray-100">
          WebApp: {tg ? 'yes' : 'no'} · initData: {initData ? 'yes' : 'no'} ·
          {' '}sign: {dbg?.status || '…'}
          {dbg?.user?.id ? ` · user:${dbg.user.username || dbg.user.id}` : ''}
        </span>
      </div>

      {dbg && dbg.status !== 'OK' && (
        <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Телеграм подпись не прошла ({dbg.status}).
          Убедись, что мини‑апп открыто тем же ботом, чей токен в проде.
        </div>
      )}

      <h1 className="text-3xl font-semibold mb-5">Пополнение</h1>

      <div className="mb-4 inline-flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('stars')}
          className={`px-4 py-2 rounded-lg ${tab==='stars' ? 'bg-white shadow' : 'opacity-70'}`}>
          Звёзды
        </button>
        <button
          onClick={() => setTab('ton')}
          className={`px-4 py-2 rounded-lg ${tab==='ton' ? 'bg-white shadow' : 'opacity-70'}`}>
          TON
        </button>
      </div>

      <label className="block text-sm mb-2">Сумма</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full border rounded-xl px-4 py-3 mb-4"
        min={1}
      />

      {tab === 'stars' ? (
        <div>
          <button
            onClick={createStarsInvoice}
            disabled={!canSubmit}
            className="w-full rounded-2xl py-3 text-white font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg disabled:opacity-50">
            {loading ? 'Создаём…' : 'Создать счёт'}
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={createTonInvoice}
            disabled={!canSubmit}
            className="w-full rounded-2xl py-3 text-white font-semibold bg-gradient-to-r from-teal-500 to-emerald-600 shadow-lg disabled:opacity-50">
            {loading ? 'Создаём…' : 'Создать счёт в TON'}
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
