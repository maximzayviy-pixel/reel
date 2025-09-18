export function isAdmin(userId?: string): boolean {
  if (!userId) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.includes(String(userId));
}
