import { Suspense } from 'react';
import ConfirmationPageClient from './ConfirmationPageClient';

// Force dynamic rendering - uses searchParams
export const dynamic = 'force-dynamic';

function LoadingFallback() {
  return (
    <div className="container section-padding">
      <div style={{ textAlign: 'center' }}>
        <div className="modern-spinner" style={{
          marginBottom: 'var(--space-4)',
          justifyContent: 'center'
        }}>
          <div className="modern-spinner-dot"></div>
          <div className="modern-spinner-dot"></div>
          <div className="modern-spinner-dot"></div>
        </div>
        <p style={{ color: 'var(--text-bright-secondary)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmationPageClient />
    </Suspense>
  );
}
