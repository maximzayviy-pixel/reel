// src/components/PayChooser.tsx
'use client';
import { Star, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayChooser(){
  const r = useRouter();
  const go = (type:'stars'|'ton') => r.push(`/topup?type=${type}`);
  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <button onClick={()=>go('stars')} className="rounded-2xl p-4 bg-gradient-to-b from-blue-500 to-sky-500 text-white shadow-lg active:translate-y-px">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6" /><span className="font-semibold">Звёздами</span>
        </div>
        <div className="text-xs opacity-90 mt-1">2 ⭐ = 1 ₽</div>
      </button>
      <button onClick={()=>go('ton')} className="rounded-2xl p-4 bg-gradient-to-b from-violet-500 to-fuchsia-500 text-white shadow-lg active:translate-y-px">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6" /><span className="font-semibold">TON</span>
        </div>
        <div className="text-xs opacity-90 mt-1">Курс с наценкой +15%</div>
      </button>
    </div>
  );
}
