'use client';
import Tabs from '../../components/Tabs';
import { useTGUser } from '../../context/UserContext';

export default function ProfilePage(){
  const user = useTGUser();
  const name = user?.username ? '@'+user.username :
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Гость';

  return (
    <>
      <div className="card flex items-center gap-3">
        {user?.photo_url
          ? <img src={user.photo_url} alt="" className="w-16 h-16 rounded-full border object-cover" />
          : <div className="w-16 h-16 rounded-full bg-gray-200" />}
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-xs opacity-60">ID: {user?.id || '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div className="card">Верификация: {user?.verified ? '✔️' : '—'}</div>
        <div className="card">Бан: {user?.banned ? '🚫' : '—'}</div>
      </div>
      <Tabs/>
    </>
  );
}
