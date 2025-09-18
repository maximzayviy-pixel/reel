'use client';
import React from 'react';
import { useTGUser } from '../context/UserContext';

export default function HeaderWallet({ rub }:{ rub:number }) {
  const user = useTGUser();
  return (
    <div className="card bg-reel text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20" />
          <div>
            <div className="text-sm opacity-90">{user?.username ? '@'+user.username : 'Reel Wallet'}</div>
            <div className="text-xs opacity-80">мини‑приложение</div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-sm opacity-80">Общий баланс</div>
        <div className="text-4xl font-bold">{rub.toLocaleString('ru-RU', {minimumFractionDigits:1, maximumFractionDigits:1})} ₽</div>
      </div>
    </div>
  );
}
