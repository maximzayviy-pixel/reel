'use client';
import Tabs from '../../components/Tabs';
import HistoryList from '../../components/HistoryList';
import { useEffect, useState } from 'react';

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { setItems([]); }, []);
  return (
    <>
      <h1 className="text-lg font-semibold mb-2">История</h1>
      <HistoryList items={items} />
      <Tabs/>
    </>
  );
}
