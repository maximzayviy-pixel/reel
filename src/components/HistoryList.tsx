'use client';
import React from 'react';

export default function HistoryList({items}:{items:any[]}){
  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.id} className="card flex items-center justify-between">
          <div>
            <div className="font-medium">{it.title || 'Платеж'}</div>
            <div className="text-xs opacity-60">{it.currency.toUpperCase()} ≈ {it.amount}</div>
          </div>
          <div className={`font-semibold ${it.type==='out'?'text-red-600':'text-green-600'}`}>
            {it.type==='out' ? '-' : '+'}{it.rub.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      ))}
      {!items.length && <div className="text-sm opacity-60 text-center">Пока пусто</div>}
    </div>
  );
}
