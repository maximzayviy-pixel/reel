'use client';
import { useState } from 'react';
import Tabs from '../../components/Tabs';
import { useTG } from '../../context/UserContext';
import { Button } from '../../components/UI';

export default function AdminPage(){
  const { initData } = useTG();
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState<number>(50);
  const [currency, setCurrency] = useState<'stars'|'ton'>('stars');
  const [banned, setBanned] = useState(false);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const call = async (path: string, payload: any) => {
    setMsg('');
    try{
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? {'x-telegram-init-data': initData} : {})
        },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Ошибка');
      setMsg('Готово ✅');
    }catch(e: any){
      setMsg('Ошибка: ' + (e?.message || ''));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Админка</h1>

      <div className="card">
        <div className="font-semibold mb-2">Начисление баланса</div>
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-xl p-2" placeholder="User ID" value={userId} onChange={e=>setUserId(e.target.value)}/>
          <select className="border rounded-xl p-2" value={currency} onChange={e=>setCurrency(e.target.value as any)}>
            <option value="stars">⭐ Stars</option>
            <option value="ton">TON</option>
          </select>
          <input type="number" className="border rounded-xl p-2" placeholder="Amount" value={amount} onChange={e=>setAmount(parseFloat(e.target.value || '0'))}/>
          <input className="border rounded-xl p-2" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}/>
        </div>
        <div className="mt-3">
          <Button onClick={()=>call('/api/admin/credit', { userId, currency, amount, note })}>Начислить</Button>
        </div>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Бан пользователя</div>
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded-xl p-2" placeholder="User ID" value={userId} onChange={e=>setUserId(e.target.value)}/>
          <select className="border rounded-xl p-2" value={String(banned)} onChange={e=>setBanned(e.target.value === 'true')}>
            <option value="false">Снять бан</option>
            <option value="true">Забанить</option>
          </select>
        </div>
        <div className="mt-3">
          <Button onClick={()=>call('/api/admin/ban', { userId, banned })}>Сохранить</Button>
        </div>
      </div>

      {msg && <div className="text-sm">{msg}</div>}
      <Tabs/>
    </div>
  );
}
