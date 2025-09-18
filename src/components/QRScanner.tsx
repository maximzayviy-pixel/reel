'use client';
import React, { useEffect } from 'react';
import { Card } from './UI';

export default function QRScanner({ onScan }) {
  useEffect(() => {
    setTimeout(() => onScan('amount=1234'), 1000);
  }, [onScan]);
  return <Card>📷 Наведи камеру на QR (демо)</Card>;
}
