import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Analytics } from '@vercel/analytics/next';
import StructuredData from '@/components/StructuredData';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';
const ogImageUrl = `${siteUrl}/images/landing/og-lanyard-landing.webp`;

export const metadata: Metadata = {
  title: 'Teevent: The best place to order custom lanyards',
  description: 'Built to save your time and effort. Teevent is the best place to order custom lanyards.',
  keywords: [
    'custom lanyards malaysia',
    'order lanyards online',
    'custom lanyard printing malaysia',
    'event lanyards malaysia',
    'lanyard supplier malaysia',
    'custom event merchandise malaysia',
    'lanyard manufacturer malaysia',
    'personalized lanyards malaysia',
    'corporate lanyards malaysia',
    'university event lanyards malaysia',
  ],
  authors: [{ name: 'Teevent Enterprise, Malaysia' }],
  creator: 'Teevent Enterprise, Malaysia',
  publisher: 'Teevent Enterprise, Malaysia',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: siteUrl,
    siteName: 'Teevent',
    title: 'Teevent: The best place to order custom lanyards',
    description: 'Built to save your time and effort. Teevent is the best place to order custom lanyards.',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Teevent - The best place to order custom lanyards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teevent: The best place to order custom lanyards',
    description: 'Built to save your time and effort. Teevent is the best place to order custom lanyards.',
    images: [ogImageUrl],
  },
  alternates: {
    canonical: siteUrl,
  },
  other: {
    'geo.region': 'MY',
    'geo.country': 'Malaysia',
    'geo.placename': 'Malaysia',
  },
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
        {/* Favicon and app icons (migrated from old root index.html) */}
        <link rel="icon" type="image/x-icon" href="/images/favicon/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/images/favicon/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/images/favicon/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/images/favicon/site.webmanifest" />
        <StructuredData />
      </head>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <Header />
        {children}
        <Analytics />
      </body>
    </html>
  );
}


