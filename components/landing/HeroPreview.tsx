'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import QuantitySelector from '@/components/QuantitySelector';
import { trackEvent } from '@/lib/ga';

export default function HeroPreview() {
  const { t } = useTranslation();
  const router = useRouter();
  // Internally we still default to 100, but the input will show it as a placeholder.
  const [quantity, setQuantity] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    if (isLoading) return;
    
    trackEvent('hero_get_started_click', {
      location: 'hero_preview',
      quantity,
    });
    setIsLoading(true);
    router.push(`/customize?quantity=${quantity}`);
  };

  return (
    <div className="hero-preview">
      <div className="preview-content-scaler">
        <div className="hero-preview-content">
          <div style={{ maxWidth: '800px', margin: '0 auto 0 auto', marginBottom: 0, textAlign: 'center' }}>
            {/* Quantity Selector Card */}
            <div className="card" style={{ padding: 'var(--space-6)', border: 'none', boxShadow: '0 0 20px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: 'var(--text-xl)', color: 'var(--text-bright-primary)' }}>
                  {t('hero.iNeed')}
                </span>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={50}
                  max={undefined}
                  showVolumeBenefits={false}
                  showButtons={false}
                  placeholder={100}
                />
                <span style={{ fontSize: 'var(--text-xl)', color: 'var(--text-bright-primary)' }}>
                  {t('hero.lanyards')}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Get Started Button (matches hero CTA pill style) */}
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="btn-primary hero-cta"
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
              t('hero.getStarted')
            )}
          </button>
          <p style={{ 
            marginTop: 'var(--space-4)', 
            fontSize: 'var(--text-sm)', 
            color: 'var(--text-bright-muted)' 
          }}>
            {t('hero.seePriceInstantly')}
          </p>
        </div>
      </div>
    </div>
  );
}

