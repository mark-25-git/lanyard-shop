'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuantitySelector from '@/components/QuantitySelector';

export default function HeroPreview() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(100);

  const handleGetStarted = () => {
    router.push(`/customize?quantity=${quantity}`);
  };

  return (
    <div className="lanyard-landing-hero-preview">
      <div className="preview-content-scaler">
        <div className="lanyard-landing-hero-preview-content">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

            {/* Quantity Card */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)',
                  textAlign: 'center',
                }}
              >
                Enter the quantity you need and see the price instantly. No sign-up needed.
                </h2>
                <div className="card" style={{ padding: 'var(--space-4)' }}>
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    min={50}
                    max={undefined}
                  showVolumeBenefits={false}
                  />
              </div>
            </div>

            {/* Get Started Button (matches hero CTA pill style) */}
            <button
              onClick={handleGetStarted}
              className="btn-primary hero-cta"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

