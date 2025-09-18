// src/app/topup/page.tsx
'use client';
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

declare global { interface Window { Telegram?: any } }

export const dynamic = 'force-dynamic';

const SegBtn = ({active, children, onClick}:{active:boolean, children:any, onClick:()=>void}) => (
  <button onClick={onClick} className={"px-4 py-2 text-sm font-medium transition " + (active ? "bg-white/15 text-white" : "text-white/70 hover:text-white") }>
    {children}
  </button>
);

function TopupInner(){
  const sp = useSearchParams();
  const defType = (sp.get('type') || 'stars') as 'stars'|'ton';
  const [type, setType] = useState<'stars'|'ton'>(defType);
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string| null>(null);

  const tg = (globalThis as any)?.Telegram?.WebApp;

  async function create(){
    setError(null); setLoading(true);
    try{
      if(type==='stars'){
        const res = await fetch('/api/topup/stars', {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            // КЛЮЧЕВОЕ: передаём initData чтобы сервер не ругался "unauthorized"
            'x-telegram-init-data': tg?.initData || ''
          },
          body: JSON.stringify({ amount })
        });
        const data = await res.json().catch(()=>null);
        if(!res.ok || !data?.invoiceLink) throw new Error(data?.error || 'create_failed');
        // внутри Telegram можно открыть сразу, иначе показать кнопку/ссылку
        if (tg?.openInvoice){
          tg.openInvoice(data.invoiceLink, (status:string)=>console.log('invoice status:',status));
        } else {
          window.location.href = data.invoiceLink;
        }
      } else {
        const res = await fetch('/api/topup/ton', {
          method:'POST',
          headers:{'Content-Type':'application/json','x-telegram-init-data': tg?.initData || ''},
          body: JSON.stringify({ rub: amount })
        });
        const data = await res.json().catch(()=>null);
        if(!res.ok || !data?.payUrl) throw new Error(data?.error || 'create_failed');
        window.location.href = data.payUrl;
      }
    }catch(e:any){
      setError(e?.message || 'unknown_error');
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="p-4 max-w-screen-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-3">Пополнение</h1>

      <div className="inline-flex rounded-2xl overflow-hidden border border-white/10 mb-3 backdrop-blur-sm">
        <SegBtn active={type==='stars'} onClick={()=>setType('stars')}>Звёзды</SegBtn>
        <SegBtn active={type==='ton'} onClick={()=>setType('ton')}>TON</SegBtn>
      </div>

      <label className="block text-sm opacity-80 mb-1">Сумма в {type==='stars'?'звёздах':'рублях'}</label>
      <input
        type="number"
        value={amount}
        onChange={e=>setAmount(Number(e.target.value||0))}
        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 mb-4 outline-none"
      />

      <button onClick={create} disabled={loading} className="w-full rounded-2xl p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg active:translate-y-px disabled:opacity-60">
        {loading?'Создаём…':'Создать счёт'}
      </button>

      {error && <p className="text-sm text-red-400 mt-3">Ошибка: {error}</p>}

      <p className="text-xs opacity-70 mt-3">
        Для звёзд оплата происходит внутри Telegram. Для TON откроется платёжная страница.
      </p>
    </main>
  );
}

export default function Page(){
  return (
    <Suspense fallback={<main className="p-4 max-w-screen-sm mx-auto"><div className="animate-pulse h-7 w-40 rounded-md bg-white/20 mb-4"/><div className="animate-pulse h-10 w-full rounded-xl bg-white/10"/></main>}>
      <TopupInner/>
    </Suspense>
  );
}
