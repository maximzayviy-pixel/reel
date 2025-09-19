'use client';
import { useEffect, useState } from 'react';

type Pay = {
  id: string;
  user_id: string;
  rub: number;
  pay_with: 'stars' | 'ton';
  cost_stars?: number;
  cost_ton?: number;
  qr_url?: string;
  comment?: string;
  created_at?: number;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<Pay[]>([]);
  const [loading, setLoading] = useState(true);
  const initData = (globalThis as any)?.Telegram?.WebApp?.initData || '';

  async function loadMe() {
    const r = await fetch('/api/me', { headers: { 'x-telegram-init-data': initData }, cache: 'no-store' });
    const j = await r.json();
    setIsAdmin(Boolean(j?.isAdmin));
  }

  async function loadList() {
    setLoading(true);
    const r = await fetch('/api/admin/sbp/list', { headers: { 'x-telegram-init-data': initData }, cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      setItems(j.items || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadMe(); }, []);
  useEffect(() => { if (isAdmin) loadList(); }, [isAdmin]);

  async function confirm(id: string) {
    const reason = prompt('Комментарий (опционально):') || undefined;
    await fetch('/api/admin/sbp/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ paymentId: id, reason }),
    });
    loadList();
  }

  async function reject(id: string) {
    const reason = prompt('Причина отклонения:') || '';
    await fetch('/api/admin/sbp/reject', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-init-data': initData },
      body: JSON.stringify({ paymentId: id, reason }),
    });
    loadList();
  }

  if (isAdmin === null) return <div className="p-5">Загрузка…</div>;
  if (!isAdmin) return <div className="p-5">Нет доступа</div>;

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-semibold">Админка · СБП заявки</h1>
      <button onClick={loadList} className="px-3 py-2 rounded bg-black text-white">Обновить</button>
      {loading ? <div>Загрузка…</div> : (
        <div className="space-y-3">
          {items.length === 0 ? <div>Пусто</div> : items.map(p => (
            <div key={p.id} className="border rounded-xl p-3">
              <div className="text-sm text-gray-500">#{p.id} · user {p.user_id}</div>
              <div className="text-lg font-medium">{p.rub} ₽ · {p.pay_with === 'stars' ? `${p.cost_stars}⭐` : `${(p.cost_ton||0).toFixed(4)} TON`}</div>
              {p.comment ? <div className="text-sm">{p.comment}</div> : null}
              {p.qr_url ? <img src={p.qr_url} alt="qr" className="w-full max-w-xs rounded mt-2" /> : null}
              <div className="mt-2 space-x-2">
                <button onClick={() => confirm(p.id)} className="px-3 py-2 rounded bg-green-600 text-white">Подтвердить</button>
                <button onClick={() => reject(p.id)} className="px-3 py-2 rounded bg-red-600 text-white">Отклонить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
