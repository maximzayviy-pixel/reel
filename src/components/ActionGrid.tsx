'use client';
import { useRouter } from 'next/navigation';
import { Plus, ArrowUpRight, ArrowLeftRight, ShoppingBag } from 'lucide-react';

export default function ActionGrid() {
  const router = useRouter();
  const Item = ({icon,label,onClick}:{icon:React.ReactNode,label:string,onClick:()=>void}) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 card active:scale-[0.99]">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{background:'linear-gradient(135deg,#0a66ff,#4fc3ff)'}}>
        {icon}
      </div>
      <div className="text-sm">{label}</div>
    </button>
  );
  return (
    <div className="grid grid-cols-4 gap-3">
      <Item icon={<Plus size={18}/>} label="Пополнить" onClick={()=>router.push('/topup')} />
      <Item icon={<ArrowUpRight size={18}/>} label="Перевести" onClick={()=>alert('Скоро')} />
      <Item icon={<ArrowLeftRight size={18}/>} label="Обменять" onClick={()=>alert('Скоро')} />
      <Item icon={<ShoppingBag size={18}/>} label="Оплатить" onClick={()=>router.push('/qr')} />
    </div>
  );
}
