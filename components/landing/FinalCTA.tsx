'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/ga';
import { useTranslation } from 'react-i18next';

export default function FinalCTA() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (isLoading) return;
    
    trackEvent('final_cta_get_started_click', {
      location: 'final_cta_section',
    });
    setIsLoading(true);
    router.push('/customize');
  };

  return (
    <section className="landing-section section-padding final-cta-section">
      <div className="container">
        <div className="final-cta-content" style={{ 
          textAlign: 'center', 
          maxWidth: '700px', 
          margin: '0 auto' 
        }}>
          <h2 className="section-title fade-in">{t('finalCTA.title')}</h2>
          <p className="section-subtitle fade-in" style={{ 
            fontSize: 'var(--text-lg)',
            color: 'var(--text-bright-secondary)',
            marginTop: 'var(--space-6)',
            marginBottom: 0
          }}>
            {t('finalCTA.subtitle')}
          </p>
          <button
            onClick={handleClick}
            disabled={isLoading}
            className="btn-primary hero-cta fade-in"
            style={{
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? (
              <div className="modern-spinner" style={{ display: 'inline-flex' }}>
                <div className="modern-spinner-dot"></div>
                <div className="modern-spinner-dot"></div>
                <div className="modern-spinner-dot"></div>
              </div>
            ) : (
              t('finalCTA.button')
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

