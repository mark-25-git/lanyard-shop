'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Note: These logos need to be added to public/images/event-logos/
// For now using placeholder paths - update when images are available
const eventLogos = [
  { src: '/images/event-logos/01-tedxutar.svg', alt: 'TEDxUTAR' },
  { src: '/images/event-logos/02-aiesec.svg', alt: 'AIESEC' },
  { src: '/images/event-logos/03-fms-kl&p.svg', alt: 'FMS KL&P' },
  { src: '/images/event-logos/7-icheme.svg', alt: 'ICHEME' },
  { src: '/images/event-logos/3-voichestra.svg', alt: 'Voichestra' },
  { src: '/images/event-logos/8-ses.svg', alt: 'SES' },
];

interface TrustBarProps {
  lanyardsDelivered: number;
}

export default function TrustBar({ lanyardsDelivered: initialLanyardsDelivered }: TrustBarProps) {
  const { t } = useTranslation();
  const [lanyardsDelivered, setLanyardsDelivered] = useState(initialLanyardsDelivered);

  // Fetch latest stats client-side as a fallback/update
  useEffect(() => {
    const fetchLatestStats = async () => {
      try {
        const response = await fetch('/api/stats', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.lanyards_delivered) {
            const latestValue = data.data.lanyards_delivered;
            // Update if different from initial value
            if (latestValue !== initialLanyardsDelivered) {
              setLanyardsDelivered(latestValue);
            }
          }
        }
      } catch (error) {
        // Silently fail - keep using the initial value on error
      }
    };

    // Fetch after a short delay to allow page to render first
    const timer = setTimeout(fetchLatestStats, 100);
    return () => clearTimeout(timer);
  }, [initialLanyardsDelivered]);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <section className="landing-section section-padding event-logos-section">
      <div className="container">
        <div className="section-header">
          <p className="section-subtitle fade-in" style={{ 
            fontSize: 'var(--text-lg)', 
            color: 'var(--text-bright-primary)',
            fontWeight: 'var(--font-weight-bold)',
            textTransform: 'none',
            letterSpacing: '0',
            marginBottom: 'var(--space-6)'
          }}>
            {t('trustBar.statement', { number: formatNumber(lanyardsDelivered) })}
          </p>
        </div>
        
        <div className="event-logos-grid">
          {eventLogos.map((logo, logoIndex) => (
            <div 
              key={logoIndex} 
              className="event-logo"
            >
              <img src={logo.src} alt={logo.alt} className="logo-image" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
