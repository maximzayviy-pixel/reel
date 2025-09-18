// src/app/topup/page.tsx
'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeOpenInvoice } from '@/lib/tg';

export const dynamic = 'force-dynamic'; // не пререндерим статикой

function TopupInner(){
  const sp = useSearchParams();
  const defType = (sp.get('type') || 'stars') as 'stars'|'ton';
  const [type, setType] = useState<'stars'|'ton'>(defType);
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async ()=>{
    setLoading(true); setError(null);
    try {
      if (type==='stars'){
        const res = await fetch('/api/topup/stars', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount }) });
        const data = await res.json().catch(()=>null);
        if (!res.ok || !data?.invoiceLink) throw new Error(data?.error || 'stars_create_failed');
        // Открываем модалку Telegram (или ссылку)
        safeOpenInvoice(data.invoiceLink);
      } else {
        const res = await fetch('/api/topup/ton', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rub: amount }) });
        const data = await res.json().catch(()=>null);
        if (!res.ok || !data?.payUrl) throw new Error(data?.error || 'ton_create_failed');
        window.location.href = data.payUrl;
      }
    } catch(e:any){
      setError(e?.message || 'create_failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-screen-sm mx-auto">
      <h1 className="text-xl font-semibold mb-3">Пополнение</h1>

      <div className="inline-flex overflow-hidden rounded-xl border border-white/10 mb-3">
        <button onClick={()=>setType('stars')} className={"px-4 py-2 "+(type==='stars'?'bg-white/10':'')}>
          Звёзды
        </button>
        <button onClick={()=>setType('ton')} className={"px-4 py-2 "+(type==='ton'?'bg-white/10':'')}>
          TON
        </button>
      </div>

      <label className="block text-sm opacity-80 mb-1">
        Сумма в {type==='stars' ? 'звёздах' : 'рублях'}
      </label>
      <input
        type="number"
        value={amount}
        onChange={e=>setAmount(Number(e.target.value||0))}
        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 mb-4 outline-none"
      />

      <button disabled={loading} onClick={create} className="w-full rounded-2xl p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg active:translate-y-px disabled:opacity-60">
        {loading ? 'Создаём…' : 'Создать счёт'}
      </button>

      {error && <p className="text-xs text-red-400 mt-3">Ошибка: {error}</p>}

      <p className="text-xs opacity-70 mt-3">
        Для звёзд оплата происходит внутри Telegram. Для TON откроется платёжная страница.
      </p>
    </main>
  );
}

export default function TopupPage(){
  return (
    <Suspense fallback={<main className="p-4 max-w-screen-sm mx-auto"><div className="animate-pulse h-7 w-40 rounded-md bg-white/20 mb-4"/><div className="animate-pulse h-10 w-full rounded-xl bg-white/10"/></main>}>
      <TopupInner/>
    </Suspense>
  );
}
