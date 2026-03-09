// src/components/AppLayout.tsx
import { ReactNode } from 'react';
import { Header } from './Header';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t text-center text-sm py-4">
        © {new Date().getFullYear()} GeoBlood
      </footer>
    </div>
  );
}
