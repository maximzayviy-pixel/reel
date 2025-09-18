'use client';
import { Plus, ArrowUpRight, ArrowLeftRight, ShoppingBag } from 'lucide-react';

export default function ActionGrid() {
  const Item = ({icon,label}:{icon:React.ReactNode,label:string}) => (
    <button className="flex flex-col items-center gap-2 card">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{background:'linear-gradient(135deg,#0a66ff,#4fc3ff)'}}>
        {icon}
      </div>
      <div className="text-sm">{label}</div>
    </button>
  );
  return (
    <div className="grid grid-cols-4 gap-3">
      <Item icon={<Plus size={18}/>} label="Пополнить" />
      <Item icon={<ArrowUpRight size={18}/>} label="Перевести" />
      <Item icon={<ArrowLeftRight size={18}/>} label="Обменять" />
      <Item icon={<ShoppingBag size={18}/>} label="Оплатить" />
    </div>
  );
}
