'use client';
import React, { useEffect, useRef, useState } from 'react';

/** Camera QR scanner using html5-qrcode, prefers back camera */
export default function CameraQR({ onScan }: { onScan: (text: string) => void }) {
  const idRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let html5QrCode: any = null;
    let stopped = false;

    (async () => {
      try {
        const mod = await import('html5-qrcode');
        const { Html5Qrcode } = mod;
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || !cameras.length) { setError('Камера не найдена'); return; }
        // предпочитаем заднюю
        const back = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1] || cameras[0];
        html5QrCode = new Html5Qrcode(idRef.current);
        await html5QrCode.start(
          back.id,
          { fps: 10, qrbox: 240 },
          (decoded: string) => {
            if (stopped) return;
            stopped = true;
            onScan(decoded);
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(()=>{});
          },
          (_err: string) => {}
        );
      } catch (e: any) {
        setError(e?.message || 'Ошибка камеры');
      }
    })();

    return () => {
      stopped = true;
      try { html5QrCode?.stop().then(()=> html5QrCode?.clear()); } catch {}
    };
  }, [onScan]);

  return (
    <div className="card">
      <div id={idRef.current} className="overflow-hidden rounded-2xl" style={{minHeight: 260}} />
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      <div className="text-xs opacity-60 mt-2">Наведи камеру на QR СБП</div>
    </div>
  );
}
