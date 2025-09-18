'use client';
import HeaderWallet from '../components/HeaderWallet';
import ActionGrid from '../components/ActionGrid';
import Tabs from '../components/Tabs';
import { useEffect, useState } from 'react';

export default function Home() {
  const [rub, setRub] = useState(0);
  useEffect(() => { setRub(0); }, []);
  return (
    <>
      <HeaderWallet rub={rub} />
      <div className="mt-4"><ActionGrid /></div>
      <Tabs/>
    </>
  );
}
