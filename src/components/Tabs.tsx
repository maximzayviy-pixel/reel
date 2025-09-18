'use client';
import Link from 'next/link';
import { Home, History, User, QrCode } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Tabs() {
  const path = usePathname();
  const Item = ({ href, icon, label }:{href:string, icon:React.ReactNode, label:string}) => {
    const active = path === href;
    return (
      <Link href={href} className={`tabbtn ${active ? 'text-black' : 'text-gray-500'}`}>
        {icon}
        <span className="mt-1">{label}</span>
      </Link>
    );
  };
  return (
    <div className="tabbar">
      <div className="max-w-md mx-auto flex">
        <Item href="/" icon={<Home size={20}/>} label="Главная" />
        <Item href="/history" icon={<History size={20}/>} label="История" />
        <Item href="/profile" icon={<User size={20}/>} label="Профиль" />
        <Item href="/qr" icon={<QrCode size={20}/>} label="QR" />
      </div>
    </div>
  );
}
