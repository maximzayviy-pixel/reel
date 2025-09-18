'use client';
import React from 'react';
import { Card } from './UI';

export const StatusCard = ({state,rub,stars,ton}) => {
  const title = state==='paid'?'✅ Оплачено':state==='rejected'?'❌ Отклонено':state==='expired'?'⏳ Истекло':'⌛ Ожидание';
  return (
    <Card>
      <div className="text-xl font-semibold">{title}</div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div>RUB: {rub}</div>
        <div>⭐: {stars}</div>
        <div>TON: {ton?.toFixed(4)}</div>
      </div>
    </Card>
  );
};
