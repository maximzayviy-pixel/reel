import './globals.css';
import { UserProvider } from '../context/UserContext';

export const metadata = { title: 'Reel Wallet', description: 'QR СБП → ⭐ / TON' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-neutral-100 min-h-screen text-neutral-900">
        <div className="container">
          <UserProvider>{children}</UserProvider>
        </div>
      </body>
    </html>
  );
}
