'use client';
import React from 'react';

export default function QRAmount({ rub, sumParam }: { rub?: number; sumParam?: string | number }) {
  const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
  let val: number | null = null;
  if (typeof rub === 'number' && !Number.isNaN(rub)) val = rub;
  else if (sumParam != null) {
    const n = parseInt(String(sumParam), 10);
    if (Number.isFinite(n)) val = n / 100; // копейки -> рубли
  }
  return <span>{val == null ? '—' : fmt.format(val)}</span>;
}
