import Link from 'next/link';
import { trackEvent } from '@/lib/ga';

export default function FinalCTA() {
  const handleClick = () => {
    trackEvent('final_cta_get_started_click', {
      location: 'final_cta_section',
    });
  };

  return (
    <section className="landing-section section-padding final-cta-section">
      <div className="container">
        <div className="final-cta-content" style={{ 
          textAlign: 'center', 
          maxWidth: '700px', 
          margin: '0 auto' 
        }}>
          <h2 className="section-title fade-in">Stop chasing suppliers for quotes.</h2>
          <p className="section-subtitle fade-in" style={{ 
            fontSize: 'var(--text-lg)',
            color: 'var(--text-bright-secondary)',
            marginTop: 'var(--space-6)',
            marginBottom: 'var(--space-8)'
          }}>
            Check if we fit your budget instantly. No sign-up needed.
          </p>
          <Link
            href="/customize"
            className="btn-primary hero-cta fade-in"
            onClick={handleClick}
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

