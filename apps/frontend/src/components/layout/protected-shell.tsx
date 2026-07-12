'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Scaffold: allow browsing shell without real auth in development.
    // Uncomment to enforce redirect:
    // if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.height = '100%';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
    };
  }, []);

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
