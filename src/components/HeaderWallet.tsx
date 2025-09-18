'use client';
import React from 'react';
import { useTGUser } from '../context/UserContext';

export default function HeaderWallet({ rub }:{ rub:number }) {
  const user = useTGUser();
  const name = user?.username ? '@'+user.username :
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Гость';

  return (
    <div className="card bg-reel text-white">
      <div className="flex items-center gap-3">
        {user?.photo_url
          ? <img src={user.photo_url} alt="" className="w-12 h-12 rounded-full border border-white/40 object-cover" />
          : <div className="w-12 h-12 rounded-full bg-white/20" />}
        <div>
          <div className="text-sm opacity-90">{name}</div>
          <div className="text-xs opacity-80">Reel Wallet</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-sm opacity-80">Общий баланс</div>
        <div className="text-4xl font-bold">{rub.toLocaleString('ru-RU', {minimumFractionDigits:1, maximumFractionDigits:1})} ₽</div>
      </div>
    </div>
  );
}
