import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'TransitOps',
  description: 'Enterprise Fleet & Transport Management System',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full overflow-hidden font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
