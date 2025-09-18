
'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useQuoteTonRub } from '@/hooks/useQuote';

function Shimmer({width='8rem'}:{width?:string}){
  return <span className="inline-block animate-pulse h-6 rounded-md bg-white/30" style={{width}}/>;
}

export default function BalanceText({ userId }:{ userId?: string }){
  const [stars, setStars] = useState<number>(0);
  const [ton, setTon] = useState<number>(0);
  const { rubPerTon, loading: quoteLoading } = useQuoteTonRub();

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, 'users', String(userId), 'wallet', 'balances');
    const unsub = onSnapshot(ref, (snap)=>{
      const data:any = snap.data() || {};
      setStars(Number(data.stars || 0));
      setTon(Number(data.ton || 0));
    });
    return () => unsub();
  }, [userId]);

  const rubFromStars = stars / 2; // 2 ⭐ = 1 ₽
  const rubFromTon = rubPerTon ? ton * rubPerTon : 0;
  const totalRub = (rubFromStars + rubFromTon);

  return (
    <div className="flex flex-col items-start gap-1">
      {userId ? (
        <span className="text-4xl font-bold tracking-wide">
          {(quoteLoading && ton>0) ? <Shimmer width="7rem"/> : totalRub.toFixed(2)} ₽
        </span>
      ) : <Shimmer width="7rem"/> }
      <span className="text-sm opacity-80">⭐ {stars} {ton>0 && `• TON ${ton}`}</span>
      {ton>0 && rubPerTon && (
        <span className="text-xs opacity-60">Курс TON≈{rubPerTon.toFixed(2)} ₽ (+15%)</span>
      )}
    </div>
  );
}
