import './globals.css';

export const metadata = { title: 'Reel Wallet', description: 'QR СБП → ⭐ / TON' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-neutral-100 min-h-screen text-neutral-900">
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
