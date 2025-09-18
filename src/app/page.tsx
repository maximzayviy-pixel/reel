'use client';
import HeaderWallet from '../components/HeaderWallet';
import ActionGrid from '../components/ActionGrid';
import Tabs from '../components/Tabs';
import { useEffect, useRef, useState } from 'react';
import { useTG } from '../context/UserContext';
import { fetchBalance } from '../lib/fetchBalance';

export default function Home() {
  const { initData } = useTG();
  const [rub, setRub] = useState(0);
  const ratesRef = useRef<{ ton:number; starsPerRub:number } | null>(null);

  // Load rates once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/rates', { cache: 'no-store' });
        const j = await res.json();
        if (mounted) {
          ratesRef.current = { ton: Number(j?.ton || 350), starsPerRub: Number(j?.starsPerRub || 2) };
        }
      } catch {
        ratesRef.current = { ton: 350, starsPerRub: 2 };
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function refreshBalance() {
    try {
      const balances = await fetchBalance(initData || undefined);
      const rates = ratesRef.current || { ton: 350, starsPerRub: 2 };
      const rubTotal = (balances.stars || 0) / (rates.starsPerRub || 2) + (balances.ton || 0) * (rates.ton || 350);
      setRub(Number(rubTotal));
    } catch (e) {
      // ignore
    }
  }

  // Initial and periodic refresh
  useEffect(() => {
    refreshBalance();
    const iv = setInterval(refreshBalance, 5000); // refresh every 5s
    const onVis = () => { if (document.visibilityState === 'visible') refreshBalance(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [initData]);

  return (
    <>
      <HeaderWallet rub={rub} />
      <div className="mt-4"><ActionGrid /></div>
      <Tabs/>
    </>
  );
}
