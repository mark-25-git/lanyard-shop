'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

function sendPageView(url: string) {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === 'undefined') return;
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: url,
  });
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Do nothing if GA is not configured
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  useEffect(() => {
    if (!pathname) return;
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    sendPageView(url);
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
      >{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', {
          page_path: window.location.pathname + window.location.search,
        });
      `}
      </Script>
    </>
  );
}


