'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Tabs from '../../components/Tabs';
import { Button } from '../../components/UI';
import { useTG } from '../../context/UserContext';
import { isAdmin } from '../../lib/isAdmin';

export default function AdminPage(){
  const { user, initData, loading } = useTG();
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAdmin(user?.id)) return;
    const load = async () => {
      try {
        const r1 = await fetch('/api/admin/mark-paid?list=pending', { cache:'no-store', headers: {'x-telegram-init-data': initData} });
        const p = await r1.json();
        setPending(p.items || []);
        const r2 = await fetch('/api/admin/users', { cache:'no-store', headers: {'x-telegram-init-data': initData} });
        const u = await r2.json();
        setUsers(u.items || []);
      } catch (e:any) { setErr(e?.message || 'Ошибка'); }
    };
    load();
  }, [initData, user?.id, loading]);

  const act = async (kind: 'paid'|'reject'|'ban'|'unban'|'verify'|'unverify', payload: any) => {
    setErr('');
    if (!initData) { setErr('Открой Mini App внутри Telegram'); return; }
    try {
      if (kind === 'paid') await fetch('/api/admin/mark-paid', { method:'POST', headers: {'Content-Type':'application/json','x-telegram-init-data': initData}, body: JSON.stringify({ paymentId: payload }) });
      if (kind === 'reject') await fetch('/api/admin/reject', { method:'POST', headers: {'Content-Type':'application/json','x-telegram-init-data': initData}, body: JSON.stringify({ paymentId: payload }) });
      if (kind === 'ban') await fetch('/api/admin/ban', { method:'POST', headers: {'Content-Type':'application/json','x-telegram-init-data': initData}, body: JSON.stringify({ userId: payload, banned: true }) });
      if (kind === 'unban') await fetch('/api/admin/ban', { method:'POST', headers: {'Content-Type':'application/json','x-telegram-init-data': initData}, body: JSON.stringify({ userId: payload, banned: false }) });
      if (kind === 'verify') await fetch('/api/admin/verify', { method:'POST', headers: {'Content-Type':'application/json','x-telegram-init-data': initData}, body: JSON.stringify({ userId: payload, verified: true }) });
      if (kind === 'unverify') await fetch('/api/admin/verify', { method:'POST', headers: {'Content-Type':'application/json','x-telegram-init-data': initData}, body: JSON.stringify({ userId: payload, verified: false }) });
      location.reload();
    } catch (e:any) { setErr(e?.message || 'Ошибка'); }
  };

  if (loading) return <div className="p-4">Загрузка…</div>;
  if (!isAdmin(user?.id)) return <div className="p-4 text-red-600">⛔ Доступ только для администратора</div>;

  return (
    <>
      <h1 className="text-lg font-semibold mb-2">Админка</h1>
      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="card">
        <div className="font-semibold mb-2">Ожидают оплаты</div>
        <div className="space-y-2">
          {pending.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2 border rounded-xl p-2">
              <div className="text-sm">
                <div>Платёж: {p.rub} ₽ ({p.currency?.toUpperCase()} ≈ {p.amount})</div>
                {p.sbp_url && <div className="text-xs opacity-60 break-all">Ссылка: {p.sbp_url}</div>}
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>act('paid', p.id)}>Оплачено</Button>
                <Button onClick={()=>act('reject', p.id)} className="!bg-red-500">Отклонить</Button>
              </div>
            </div>
          ))}
          {!pending.length && <div className="text-sm opacity-60">Нет заявок</div>}
        </div>
      </div>

      <div className="card mt-4">
        <div className="font-semibold mb-2">Пользователи</div>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-2 border rounded-xl p-2">
              <div className="text-sm">
                <div>ID: {u.id} {u.verified ? '✔️' : ''} {u.banned ? '🚫' : ''}</div>
                <div className="text-xs opacity-60">@{u.username || 'user'}</div>
              </div>
              <div className="flex gap-2">
                {u.banned
                  ? <Button onClick={()=>act('unban', u.id)}>Разбанить</Button>
                  : <Button onClick={()=>act('ban', u.id)} className="!bg-red-500">Забанить</Button>}
                {u.verified
                  ? <Button onClick={()=>act('unverify', u.id)}>Снять галочку</Button>
                  : <Button onClick={()=>act('verify', u.id)}>Выдать галочку</Button>}
              </div>
            </div>
          ))}
          {!users.length && <div className="text-sm opacity-60">Пользователей нет</div>}
        </div>
      </div>

      <Tabs/>
    </>
  );
}
