import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Custom Lanyard Ordering | Teevent - Modern Event Merchandise Platform',
  description: 'Built to save your time and effort. Stop waiting for manual quotes. Teevent is the modern way to customize and order event lanyards in Malaysia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
      </head>
      <body className={inter.className}>
        <Header />
        {children}
        <Analytics />
      </body>
    </html>
  );
}


