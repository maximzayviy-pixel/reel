'use client';
import React from 'react';
import QRAmount from '../../components/QRAmount';

type SbpOrder = {
  ok: boolean;
  id: string;
  rub: number;         // уже в рублях
  cost_stars: number;
  cost_ton: number;
};

export default function TopupPage() {
  const [link, setLink] = React.useState('');
  const [order, setOrder] = React.useState<SbpOrder | null>(null);
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function handleCreate() {
    setErr(null);
    setSending(true);
    setOrder(null);
    try {
      const res = await fetch('/api/sbp/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qrUrl: link }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'server_error');
      setOrder(j as SbpOrder);
    } catch (e:any) {
      setErr(e?.message || 'error');
    } finally {
      setSending(false);
    }
  }

  const sumParam = React.useMemo(() => {
    try {
      const url = new URL(link);
      return url.searchParams.get('sum') || undefined;
    } catch { return undefined; }
  }, [link]);

  return (
    <div className="max-w-xl mx-auto p-5 pb-24">
      <div className="mb-4">
        <a href="/" className="text-blue-500 hover:underline">Назад</a>
      </div>
      <h1 className="text-3xl font-semibold mb-5">Пополнение</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Вставь ссылку СБП:</label>
        <input
          className="w-full rounded-xl border p-3"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://qr.nspk.ru/...?sum=10700"
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={!link || sending}
        className="w-full rounded-xl py-3 font-semibold text-white bg-blue-600 disabled:opacity-50"
      >
        {sending ? 'Отправляю…' : 'Рассчитать и отправить админу'}
      </button>

      {err && <p className="mt-3 text-red-600">Ошибка: {err}</p>}

      <div className="mt-6 rounded-2xl border p-4 space-y-3">
        <div className="text-sm opacity-70">Сумма к оплате (рубли):</div>
        <div className="text-2xl font-semibold">
          <QRAmount rub={order?.rub} sumParam={sumParam} />
        </div>
        {order && (
          <div className="flex items-center justify-between gap-3 text-lg pt-2">
            <div>⭐: <b>{order.cost_stars}</b></div>
            <div>TON: <b>{order.cost_ton}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}
